import { UA, WebSocketInterface } from "jssip/lib/JsSIP";
import { RTCSessionEvent, CallOptions } from "jssip/lib/UA";
import { EndEvent, PeerConnectionEvent, IncomingEvent, IceCandidateEvent, RTCSession } from "jssip/lib/RTCSession";
import pjson from "../package.json";

const version = pjson.version;

console.info(
    `%c SIP-CORE %c ${version} `,
    "color: white; background: dodgerblue; font-weight: 700;",
    "color: dodgerblue; background: white; font-weight: 700;",
);

/** Enum representing the various states of a SIP call */
export enum CALLSTATE {
    IDLE = "idle",
    INCOMING = "incoming",
    OUTGOING = "outgoing",
    CONNECTING = "connecting",
    CONNECTED = "connected",
}

/** Enum representing the kind of audio device */
export enum AUDIO_DEVICE_KIND {
    INPUT = "audioinput",
    OUTPUT = "audiooutput",
}

/** Mapping of a Home Assistant username to a SIP user */
export interface User {
    ha_username: string;
    display_name: string;
    extension: string;
    password: string;
}

export interface ICEConfig extends RTCConfiguration {
    /** Timeout in milliseconds for ICE gathering */
    iceGatheringTimeout?: number;
}

/** Configuration for SIP Core */
export interface SIPCoreConfig {
    ice_config: ICEConfig;
    backup_user: User;
    users: User[];
    /** URL for incoming call ringtone */
    incomingRingtoneUrl: string;
    /** URL for outgoing call ringtone */
    outgoingRingtoneUrl: string;
    /** Output configuration */
    out: String;
    auto_answer: boolean;
    popup_config: Object | null;
    popup_override_component: string | null;
    /**
     * Whether to use video in SIP calls.
     * @experimental
     */
    sip_video: boolean;
    pbx_server: string;
    /**
     * Custom WebSocket URL to use when ingress is not setup
     *
     * @example
     * "wss://sip.example.com/ws"
     */
    custom_wss_url: string;
}

/**
 * Main class for SIP Core functionality.
 * Handles SIP registration, call management, and audio device management.
 */
export class SIPCore {
    /**
     * The JSSIP User Agent instance
     * @see {@link https://jssip.net/documentation/3.1.x/api/ua/}
     */
    public ua!: UA;

    /**
     * The current RTC session, if available
     * @see {@link https://jssip.net/documentation/3.1.x/api/session/}
     */
    public RTCSession: RTCSession | null = null;

    public version: string = version;
    public hass: any;
    public user!: User;
    public config!: SIPCoreConfig;

    private heartBeatHandle: ReturnType<typeof setInterval> | null = null;
    private heartBeatIntervalMs: number = 30000;

    private callTimerHandle: ReturnType<typeof setInterval> | null = null;

    private wssUrl!: string;
    private iceCandidateTimeout: ReturnType<typeof setTimeout> | null = null;

    public remoteAudioStream: MediaStream | null = null;
    public remoteVideoStream: MediaStream | null = null;

    public incomingAudio: HTMLAudioElement | null = null;
    public outgoingAudio: HTMLAudioElement | null = null;

    constructor() {
        // Get hass instance
        const homeAssistant = document.querySelector("home-assistant");
        if (!homeAssistant) {
            throw new Error("Home Assistant element not found");
        }
        this.hass = (homeAssistant as any).hass;

        // Bind event handlers
        this.handleRemoteTrackEvent = this.handleRemoteTrackEvent.bind(this);
        this.handleIceGatheringStateChangeEvent = this.handleIceGatheringStateChangeEvent.bind(this);
    }

    /** Returns the remote extension. Returns `null` if not in a call */
    get remoteExtension(): string | null {
        return this.RTCSession?.remote_identity.uri.user || null;
    }

    /** Returns the remote display name if available, otherwise the extension. Returns `null` if not in a call */
    get remoteName(): string | null {
        return this.RTCSession?.remote_identity.display_name || this.RTCSession?.remote_identity.uri.user || null;
    }

    get registered(): boolean {
        return this.ua.isRegistered();
    }

    private async fetchWSSUrl(): Promise<string> {
        if (this.config.custom_wss_url) {
            console.debug("Using custom WSS URL:", this.config.custom_wss_url);
            return this.config.custom_wss_url;
        }

        // async fetch ingress entry
        const token = this.hass.auth.data.access_token;
        try {
            const resp = await fetch("/api/sip-core/asterisk-ingress", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (resp.ok) {
                const data = await resp.json();
                const wssProtocol = window.location.protocol == "https:" ? "wss" : "ws";
                console.debug("Ingress entry fetched:", data.ingress_entry);
                return `${wssProtocol}://${window.location.host}${data.ingress_entry}/ws`;
            } else {
                throw new Error(`Failed to fetch ingress entry: ${resp.statusText}`);
            }
        } catch (error) {
            console.error("Error fetching ingress entry:", error);
            throw new Error("No ingress entry or custom WSS URL provided");
        }
    }

    private async callOptions(): Promise<CallOptions> {
        let micStream: MediaStream | undefined = undefined;
        if (this.AudioInputId !== null) {
            console.debug(`Using audio input device: ${this.AudioInputId}`);
            try {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: { exact: this.AudioInputId },
                    },
                    video: this.config.sip_video,
                });
            } catch (err) {
                console.error(`Error getting audio input: ${err}`);
                micStream = undefined;
            }
        }

        if (this.AudioOutputId !== null) {
            console.debug(`Using audio output device: ${this.AudioOutputId}`);
            let audioElement = document.getElementById("remoteAudio") as any;
            try {
                await audioElement.setSinkId(this.AudioOutputId);
            } catch (err) {
                console.error(`Error setting audio output: ${err}`);
            }
        }

        return {
            mediaConstraints: {
                audio: true,
                video: this.config.sip_video,
            },
            mediaStream: micStream,
            rtcConstraints: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: this.config.sip_video,
            },
            pcConfig: this.config.ice_config,
        };
    }

    get callState(): CALLSTATE {
        if (this.RTCSession?.isEstablished()) {
            return CALLSTATE.CONNECTED;
        } else if (this.RTCSession?.connection?.connectionState === "connecting") {
            return CALLSTATE.CONNECTING;
        } else if (this.RTCSession?.isInProgress()) {
            return this.RTCSession?.direction === "incoming" ? CALLSTATE.INCOMING : CALLSTATE.OUTGOING;
        }
        return CALLSTATE.IDLE;
    }

    /** Returns call duration in format `0:00` */
    get callDuration(): string {
        if (this.RTCSession?.start_time) {
            var delta = Math.floor((Date.now() - this.RTCSession.start_time.getTime()) / 1000);
            var minutes = Math.floor(delta / 60);
            var seconds = delta % 60;
            return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        }
        return "0:00";
    }

    get AudioOutputId(): string | null {
        return localStorage.getItem("sipcore-audio-output");
    }

    set AudioOutputId(deviceId: string | null) {
        if (deviceId === null) {
            localStorage.removeItem("sipcore-audio-output");
        } else {
            localStorage.setItem("sipcore-audio-output", deviceId);
        }
        console.debug(`Audio output set to ${deviceId}`);
    }

    get AudioInputId(): string | null {
        return localStorage.getItem("sipcore-audio-input");
    }

    set AudioInputId(deviceId: string | null) {
        if (deviceId === null) {
            localStorage.removeItem("sipcore-audio-input");
        } else {
            localStorage.setItem("sipcore-audio-input", deviceId);
        }
        console.debug(`Audio input set to ${deviceId}`);
    }

    private async setupAudio() {
        this.incomingAudio = new Audio(this.config.incomingRingtoneUrl);
        this.outgoingAudio = new Audio(this.config.outgoingRingtoneUrl);
        this.incomingAudio.loop = true;
        this.outgoingAudio.loop = true;

        let audioElement = document.createElement("audio") as any;
        audioElement.id = "remoteAudio";
        audioElement.autoplay = true;
        audioElement.style.display = "none";
        document.body.appendChild(audioElement);
    }

    private setupPopup() {
        let POPUP_COMPONENT = this.config.popup_override_component || "sip-call-dialog";
        if (document.getElementsByTagName(POPUP_COMPONENT).length < 1) {
            document.body.appendChild(document.createElement(POPUP_COMPONENT));
        }
    }

    private startCallTimer() {
        this.callTimerHandle = setInterval(() => {
            this.triggerUpdate();
        }, 1000);
    }

    private stopCallTimer() {
        if (this.callTimerHandle) {
            clearInterval(this.callTimerHandle);
            this.callTimerHandle = null;
        }
    }

    async init() {
        this.config = await this.fetchConfig(this.hass);
        window.addEventListener("location-changed", async () => {
            console.debug("View changed, refresh config...");
            let new_config = await this.fetchConfig(this.hass);
            if (JSON.stringify(new_config) !== JSON.stringify(this.config)) {
                console.info("Configuration changed, reloading SIP Core...");
                this.ua.stop();
                this.config = new_config;
                await this.setupUser();
                this.wssUrl = await this.fetchWSSUrl();
                console.debug(`Connecting to ${this.wssUrl}...`);
                this.ua.start();
                this.triggerUpdate();
            }
        });
        this.wssUrl = await this.fetchWSSUrl();
        await this.createHassioSession();
        await this.setupAudio();
        await this.setupUser();

        console.debug(`Connecting to ${this.wssUrl}...`);
        this.ua.start();
        if (this.config.popup_config !== null) {
            this.setupPopup();
        }
        this.triggerUpdate();

        // autocall if set
        const autocall_extension = new URLSearchParams(window.location.search).get("call");
        if (autocall_extension) {
            console.info(`Autocalling ${autocall_extension}...`);
            this.startCall(autocall_extension);
        }
    }

    private async setupUser(): Promise<void> {
        const currentUserId = this.hass.user.id;
        const currentUserName = this.hass.user.name;

        // 1. Check exact match by User ID
        let matchedUser = this.config.users.find((user) => user.ha_username === currentUserId);

        // 2. Check match by User Name (if no ID match)
        if (!matchedUser) {
            matchedUser = this.config.users.find((user) => user.ha_username === currentUserName);
        }

        if (matchedUser) {
            this.user = matchedUser;
        } else {
            console.warn(`No matching SIP user found for Home Assistant user: ${currentUserName} (${currentUserId}). Using backup user.`);
            this.user = this.config.backup_user;
        }
        console.debug(`Selected user: ${this.user.ha_username} (${this.user.extension})`);
        this.ua = this.setupUA();
    }

    private async fetchConfig(hass: any): Promise<SIPCoreConfig> {
        const token = hass.auth.data.access_token;
        const resp = await fetch("/api/sip-core/config?t=" + Date.now(), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (resp.ok) {
            const config: SIPCoreConfig = await resp.json();
            console.debug("SIP-Core Config fetched:", config);
            return config;
        } else {
            console.error("No SIP-Core config found at /config/www/sip-config.json!");
            throw new Error(`Failed to fetch sip-config.json: ${resp.statusText}`);
        }
    }

    playIncomingRingtone(): void {
        if (this.incomingAudio) {
            this.incomingAudio.src = this.config.incomingRingtoneUrl;
            this.incomingAudio.play().catch((error) => {
                console.error("Incoming ringtone failed:", error);
            });
        }
    }

    stopIncomingRingtone(): void {
        if (this.incomingAudio) {
            this.incomingAudio.pause();
            this.incomingAudio.currentTime = 0;
            this.incomingAudio.src = "";
            this.incomingAudio.load();
        }
    }

    playOutgoingTone(): void {
        if (this.outgoingAudio) {
            this.outgoingAudio.src = this.config.outgoingRingtoneUrl;
            this.outgoingAudio.play().catch((error) => {
                console.error("Outgoing ringtone failed:", error);
            });
        }
    }

    stopOutgoingTone(): void {
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio.currentTime = 0;
            this.outgoingAudio.src = "";
            this.outgoingAudio.load();
        }
    }

    async answerCall() {
        if (this.callState !== CALLSTATE.INCOMING) {
            console.warn("Not in incoming call state. Cannot answer.");
            return;
        }
        this.RTCSession?.answer(await this.callOptions());
        this.triggerUpdate();
    }

    async endCall() {
        this.RTCSession?.terminate();
        this.triggerUpdate();
    }

    async startCall(extension: string) {
        this.ua.call(extension, await this.callOptions());
    }

    /** Dispatches a `sipcore-update` event */
    triggerUpdate() {
        window.dispatchEvent(new Event("sipcore-update"));
    }

    private setupUA(): UA {
        const socket = new WebSocketInterface(this.wssUrl);
        const ua = new UA({
            sockets: [socket],
            uri: `${this.user.extension}@${this.config.pbx_server || window.location.host}`,
            authorization_user: this.user.extension,
            display_name: this.user.display_name || this.user.ha_username,
            password: this.user.password,
            register: true,
        });

        ua.on("registered", (e) => {
            console.info("Registered");
            this.triggerUpdate();

            if (this.heartBeatHandle != null) {
                clearInterval(this.heartBeatHandle);
            }
            this.heartBeatHandle = setInterval(() => {
                console.debug("Sending heartbeat");
                socket.send("\n\n");
            }, this.heartBeatIntervalMs);
        });
        ua.on("unregistered", (e) => {
            console.warn("Unregistered");
            this.triggerUpdate();
            if (this.heartBeatHandle != null) {
                clearInterval(this.heartBeatHandle);
            }
        });
        ua.on("registrationFailed", (e) => {
            console.error("Registration failed:", e);
            this.triggerUpdate();
            if (this.heartBeatHandle != null) {
                clearInterval(this.heartBeatHandle);
            }

            if (e.cause === "Connection Error") {
                console.error("Connection error. Retrying...");
                setTimeout(() => {
                    this.ua.start();
                }, 5000);
            }
        });
        ua.on("newRTCSession", (e: RTCSessionEvent) => {
            console.debug(`New RTC Session: ${e.originator}`);

            if (this.RTCSession !== null) {
                console.debug("Terminating new RTC session");
                e.session.terminate();
                return;
            }
            this.RTCSession = e.session;

            e.session.on("failed", (e: EndEvent) => {
                console.warn("Call failed:", e);
                window.dispatchEvent(new Event("sipcore-call-ended"));
                this.RTCSession = null;
                this.remoteVideoStream = null;
                this.remoteAudioStream = null;
                this.stopCallTimer();
                this.stopOutgoingTone();
                this.stopIncomingRingtone();
                this.triggerUpdate();
            });
            e.session.on("ended", (e: EndEvent) => {
                console.info("Call ended:", e);
                window.dispatchEvent(new Event("sipcore-call-ended"));
                this.RTCSession = null;
                this.remoteVideoStream = null;
                this.remoteAudioStream = null;
                this.stopCallTimer();
                this.stopOutgoingTone();
                this.stopIncomingRingtone();
                this.triggerUpdate();
            });
            e.session.on("accepted", (e: IncomingEvent) => {
                console.info("Call accepted");
                this.startCallTimer();
                this.stopOutgoingTone();
                this.stopIncomingRingtone();
                this.triggerUpdate();
            });

            e.session.on("icecandidate", (e: IceCandidateEvent) => {
                console.debug("ICE candidate:", e.candidate?.candidate);
                if (this.iceCandidateTimeout != null) {
                    clearTimeout(this.iceCandidateTimeout);
                }

                this.iceCandidateTimeout = setTimeout(() => {
                    console.debug("ICE stopped gathering candidates due to timeout");
                    e.ready();
                }, this.config.ice_config.iceGatheringTimeout || 5000);
            });

            window.dispatchEvent(new Event("sipcore-call-started"));

            switch (e.session.direction) {
                case "incoming":
                    console.info("Incoming call");
                    this.triggerUpdate();
                    this.playIncomingRingtone();

                    e.session.on("peerconnection", (e: PeerConnectionEvent) => {
                        console.debug("Incoming call peer connection established");

                        e.peerconnection.addEventListener("track", this.handleRemoteTrackEvent);
                        e.peerconnection.addEventListener(
                            "icegatheringstatechange",
                            this.handleIceGatheringStateChangeEvent,
                        );
                    });

                    if (this.config.auto_answer) {
                        console.info("Auto answering call...");
                        this.answerCall();
                    }
                    break;

                case "outgoing":
                    console.info("Outgoing call");
                    this.playOutgoingTone();
                    this.triggerUpdate();

                    e.session.connection.addEventListener("track", this.handleRemoteTrackEvent);
                    e.session.connection.addEventListener(
                        "icegatheringstatechange",
                        this.handleIceGatheringStateChangeEvent,
                    );
                    break;
            }
        });
        return ua;
    }

    private handleIceGatheringStateChangeEvent(e: any) {
        console.debug("ICE gathering state changed:", e.target?.iceGatheringState);
        if (e.target?.iceGatheringState === "complete") {
            console.debug("ICE gathering complete");
            if (this.iceCandidateTimeout != null) {
                clearTimeout(this.iceCandidateTimeout);
            }
        }
    }

    private async handleRemoteTrackEvent(e: RTCTrackEvent) {
        let stream: MediaStream;
        if (e.streams.length > 0) {
            console.debug(`Received remote streams amount: ${e.streams.length}. Using first stream...`);
            stream = e.streams[0];
        } else {
            console.debug("No associated streams. Creating new stream...");
            stream = new MediaStream();
            stream.addTrack(e.track);
        }

        let remoteAudio = document.getElementById("remoteAudio") as HTMLAudioElement;
        if (e.track.kind === "audio" && remoteAudio.srcObject != stream) {
            this.remoteAudioStream = stream;
            remoteAudio.srcObject = stream;
            try {
                await remoteAudio.play();
            } catch (err) {
                console.error("Error starting audio playback: " + err);
            }
        }

        if (e.track.kind === "video") {
            console.debug("Received remote video track");
            this.remoteVideoStream = stream;
        }

        this.triggerUpdate();
    }

    // borrowed from https://github.com/lovelylain/ha-addon-iframe-card/blob/main/src/hassio-ingress.ts
    private setIngressCookie(session: string): string {
        document.cookie = `ingress_session=${session};path=/api/hassio_ingress/;SameSite=Strict${
            location.protocol === "https:" ? ";Secure" : ""
        }`;
        return session;
    }

    private async createHassioSession(): Promise<void> {
        try {
            const resp: { session: string } = await this.hass.callWS({
                type: "supervisor/api",
                endpoint: "/ingress/session",
                method: "post",
            });
            this.setIngressCookie(resp.session);
        } catch (error) {
            if ((error as any)?.code === "unknown_command") {
                console.info("Home Assistant Supervisor API not available. Assuming not running on Home Assistant OS.");
            } else {
                console.error("Error creating Hass.io session:", error);
                throw error;
            }
        }
    }

    private async validateHassioSession(session: string) {
        await this.hass.callWS({
            type: "supervisor/api",
            endpoint: "/ingress/validate_session",
            method: "post",
            data: { session },
        });
        this.setIngressCookie(session);
    }

    /** Returns a list of audio devices of the specified kind */
    async getAudioDevices(audioKind: AUDIO_DEVICE_KIND) {
        console.debug(`Fetching audio devices of kind: ${audioKind}`);
        // first get permission to use audio devices
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind == audioKind);
    }
}

/** @hidden */
const sipCore = new SIPCore();
await sipCore.init().catch((error) => {
    console.error("Error initializing SIP Core:", error);
});
(window as any).sipCore = sipCore;
export { sipCore };
