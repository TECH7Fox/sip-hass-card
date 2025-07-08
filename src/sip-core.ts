import { UA, WebSocketInterface } from "jssip/lib/JsSIP";
import { RTCSessionEvent, CallOptions } from "jssip/lib/UA";
import {
    EndEvent,
    PeerConnectionEvent,
    IncomingEvent,
    IceCandidateEvent,
    RTCSession,
} from "jssip/lib/RTCSession";

const version = "4.0.5";

console.info(
    `%c SIP-CORE %c ${version} `,
    "color: white; background: dodgerblue; font-weight: 700;",
    "color: dodgerblue; background: white; font-weight: 700;"
);

/** Enum representing the various states of a SIP call */
export enum CALLSTATE {
    IDLE,
    INCOMING,
    OUTGOING,
    CONNECTING,
    CONNECTED,
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
    microphone_mute_on_incoming: boolean;
    microphone_mute_on_outgoing: boolean;
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
    public ua: UA;
    
    /**
     * The current RTC session, if available
     * @see {@link https://jssip.net/documentation/3.1.x/api/session/}
    */
    public RTCSession: RTCSession | null = null;
    
    public version: string = version;
    public hass: any;
    public user: User;
    public config: SIPCoreConfig;

    private heartBeatHandle: NodeJS.Timeout | null = null;
    private heartBeatIntervalMs: number = 30000;

    private callTimerHandle: NodeJS.Timeout | null = null;

    private wssUrl: string;
    private iceCandidateTimeout: NodeJS.Timeout | null = null;
    private callOptions: CallOptions;

    public currentAudioInputId: string | null =
        localStorage.getItem("sipcore-audio-input") || null;
    public currentAudioOutputId: string | null =
        localStorage.getItem("sipcore-audio-output") || null;
    public remoteAudioStream: MediaStream | null = null;
    public remoteVideoStream: MediaStream | null = null;

    public incomingAudio: HTMLAudioElement | null = null;
    public outgoingAudio: HTMLAudioElement | null = null;

    constructor() {
        this.config = this.fetchConfig();

        // Get hass instance
        const homeAssistant = document.querySelector("home-assistant");
        if (!homeAssistant) {
            throw new Error("Home Assistant element not found");
        }
        this.hass = (homeAssistant as any).hass;

        // ring tones
        this.incomingAudio = this.config.incomingRingtoneUrl
            ? new Audio(this.config.incomingRingtoneUrl)
            : null;
        this.outgoingAudio = this.config.outgoingRingtoneUrl
            ? new Audio(this.config.outgoingRingtoneUrl)
            : null;

        this.incomingAudio && (this.incomingAudio.loop = true);
        this.incomingAudio && (this.incomingAudio.loop = true);

        // Determine websocket URL
        const ingressEntry =
            this.hass.states["text.asterisk_addon_ingress_entry"]?.state;
        if (ingressEntry) {
            const wssProtocol = window.location.protocol == "https:" ? "wss" : "ws";
            this.wssUrl = `${wssProtocol}://${window.location.host}${ingressEntry}/ws`;
        } else if (this.config.custom_wss_url) {
            this.wssUrl = this.config.custom_wss_url;
        } else {
            throw new Error("No ingress entry or custom WSS URL provided");
        }

        // Get current user
        this.user =
            this.config.users.find(
                (user) => user.ha_username === this.hass.user.name
            ) || this.config.backup_user;

        console.info(
            `Selected user: ${this.user.ha_username} (${this.user.extension})`
        );

        this.callOptions = {
            mediaConstraints: {
                audio: true,
                video: this.config.sip_video,
            },
            rtcConstraints: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: this.config.sip_video,
            },
            pcConfig: this.config.ice_config,
        };

        // Bind event handlers
        this.handleRemoteTrackEvent = this.handleRemoteTrackEvent.bind(this);
        this.handleIceGatheringStateChangeEvent =
            this.handleIceGatheringStateChangeEvent.bind(this);

        this.ua = this.setupUA();
    }

    /** Returns the remote extension. Returns `null` if not in a call */
    get remoteExtension(): string | null {
        return this.RTCSession?.remote_identity.uri.user || null;
    }

    /** Returns the remote display name if available, otherwise the extension. Returns `null` if not in a call */
    get remoteName(): string | null {
        return (
            this.RTCSession?.remote_identity.display_name ||
            this.RTCSession?.remote_identity.uri.user ||
            null
        );
    }

    get registered(): boolean {
        return this.ua.isRegistered();
    }

    get callState(): CALLSTATE {
        if (this.RTCSession?.isEstablished()) {
            return CALLSTATE.CONNECTED;
        } else if (this.RTCSession?.connection?.connectionState === "connecting") {
            return CALLSTATE.CONNECTING;
        } else if (this.RTCSession?.isInProgress()) {
            return this.RTCSession?.direction === "incoming"
                ? CALLSTATE.INCOMING
                : CALLSTATE.OUTGOING;
        }
        return CALLSTATE.IDLE;
    }

    /** Returns call duration in format `0:00` */
    get callDuration(): string {
        if (this.RTCSession?.start_time) {
            var delta = Math.floor(
                (Date.now() - this.RTCSession.start_time.getTime()) / 1000
            );
            var minutes = Math.floor(delta / 60);
            var seconds = delta % 60;
            return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        }
        return "0:00";
    }

    private async setupAudio() {
        let audioElement = document.createElement('audio') as any;
        audioElement.id = 'remoteAudio';
        audioElement.autoplay = true;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);

        if (this.currentAudioInputId) {
            await this.setAudioDevice(
                this.currentAudioInputId,
                AUDIO_DEVICE_KIND.INPUT
            );
        }

        if (this.currentAudioOutputId) {
            await this.setAudioDevice(
                this.currentAudioOutputId,
                AUDIO_DEVICE_KIND.OUTPUT
            );
        }
    }

    private setupPopup() {
        let POPUP_COMPONENT =
            this.config.popup_override_component || "sip-call-dialog";
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
        await this.createHassioSession();
        await this.setupAudio();

        if (this.config.sip_video) {
            // Request permission to use video devices for later use
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }

        console.info(`Connecting to ${this.wssUrl}...`);
        this.ua.start();
        if (this.config.popup_config !== null) {
            this.setupPopup();
        }
        this.triggerUpdate();

        // autocall if set
        const autocall_extension = new URLSearchParams(window.location.search).get(
            "call"
        );
        if (autocall_extension) {
            console.info(`Autocalling ${autocall_extension}...`);
            this.startCall(autocall_extension);
        }
    }

    private fetchConfig(): SIPCoreConfig {
        const request = new XMLHttpRequest();
        request.open("GET", `/local/sip-config.json?${new Date().getTime()}`, false);
        request.send(null);

        if (request.status === 200) {
            const config: SIPCoreConfig = JSON.parse(request.responseText);
            console.debug("SIP-Core Config fetched:", config);
            return config;
        } else {
            throw new Error(`Failed to fetch config: ${request.statusText}`);
        }
    }

    playIncomingRingtone(): void {
        if (this.incomingAudio) {
            this.incomingAudio.play().catch((error) => {
                console.error("Incoming ringtone failed:", error);
            });
        }
    }

    stopIncomingRingtone(): void {
        if (this.incomingAudio) {
            this.incomingAudio.pause();
            this.incomingAudio.currentTime = 0;
        }
    }

    playOutgoingTone(): void {
        if (this.outgoingAudio) {
            this.outgoingAudio.play().catch((error) => {
                console.error("Incoming ringtone failed:", error);
            });
        }
    }

    stopOutgoingTone(): void {
        if (this.outgoingAudio) {
            this.outgoingAudio.pause();
            this.outgoingAudio.currentTime = 0;
        }
    }

    answerCall() {
        if (this.callState !== CALLSTATE.INCOMING) {
            console.warn("Not in incoming call state. Cannot answer.");
            return;
        }
        this.RTCSession?.answer(this.callOptions);
        this.triggerUpdate();
    }

    endCall() {
        this.RTCSession?.terminate();
        this.triggerUpdate();
    }

    startCall(extension: string) {
        this.ua.call(extension, this.callOptions);
    }

    /** Dispatches a `sipcore-update` event */
    triggerUpdate() {
        window.dispatchEvent(new Event("sipcore-update"));
    }

    private setupUA(): UA {
        const socket = new WebSocketInterface(this.wssUrl);
        const ua = new UA({
            sockets: [socket],
            uri: `${this.user.extension}@${this.config.pbx_server || window.location.host
                }`,
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
                console.info("Terminating new RTC session");
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
                switch (this.RTCSession?.direction) {
                    case "incoming":
                        console.info("Incoming call");
                        if (this.config.microphone_mute_on_incoming) {
                            this.RTCSession?.mute({ audio: true });
                        }
                    case "outgoing":
                        console.info("Outgoing call");
                        if (this.config.microphone_mute_on_outgoing) {
                            this.RTCSession?.mute({ audio: true });
                        }
                        break;
                }
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
                    if (this.config.microphone_mute_on_incoming) {
                        e.session.mute({audio: true});
                    }
                    this.triggerUpdate();
                    this.playIncomingRingtone();

                    e.session.on("peerconnection", (e: PeerConnectionEvent) => {
                        console.info("Incoming call peer connection established");

                        e.peerconnection.addEventListener(
                            "track",
                            this.handleRemoteTrackEvent
                        );
                        e.peerconnection.addEventListener(
                            "icegatheringstatechange",
                            this.handleIceGatheringStateChangeEvent
                        );
                    });

                    if (this.config.auto_answer) {
                        console.info("Auto answering call...");
                        this.answerCall();
                    }
                    break;

                case "outgoing":
                    console.info("Outgoing call");
                    if (this.config.microphone_mute_on_outgoing) {
                        e.session.mute({audio: true});
                    }
                    this.playOutgoingTone();
                    this.triggerUpdate();

                    e.session.connection.addEventListener(
                        "track",
                        this.handleRemoteTrackEvent
                    );
                    e.session.connection.addEventListener(
                        "icegatheringstatechange",
                        this.handleIceGatheringStateChangeEvent
                    );
                    break;
            }
        });
        return ua;
    }

    private handleIceGatheringStateChangeEvent(e: any) {
        console.debug("ICE gathering state changed:", e.target?.iceGatheringState);
        if (e.target?.iceGatheringState === "complete") {
            console.info("ICE gathering complete");
            if (this.iceCandidateTimeout != null) {
                clearTimeout(this.iceCandidateTimeout);
            }
        }
    }

    private async handleRemoteTrackEvent(e: RTCTrackEvent) {
        let stream: MediaStream | null = null;
        if (e.streams.length > 0) {
            console.debug(
                `Received remote streams amount: ${e.streams.length}. Using first stream...`
            );
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
            console.info("Received remote video track");
            this.remoteVideoStream = stream;
        }

        this.triggerUpdate();
    }

    // borrowed from https://github.com/lovelylain/ha-addon-iframe-card/blob/main/src/hassio-ingress.ts
    private setIngressCookie(session: string): string {
        document.cookie = `ingress_session=${session};path=/api/hassio_ingress/;SameSite=Strict${location.protocol === "https:" ? ";Secure" : ""
            }`;
        return session;
    }

    private async createHassioSession(): Promise<string> {
        const resp: { session: string; } = await this.hass.callWS({
            type: "supervisor/api",
            endpoint: "/ingress/session",
            method: "post",
        });
        return this.setIngressCookie(resp.session);
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
        // first get permission to use audio devices
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind == audioKind);
    }

    /**
     * Sets the audio device for the specified kind
     *
     * @example
     * ```ts
     * const audio_devices = await sipCore.getAudioDevices(AUDIO_DEVICE_KIND.INPUT);
     * await sipCore.setAudioDevice(audio_devices[0].deviceId, AUDIO_DEVICE_KIND.INPUT);
     * ```
     */
    async setAudioDevice(deviceId: string, audioKind: AUDIO_DEVICE_KIND) {
        console.info(`Setting audio device ${deviceId} (${audioKind})`);
        switch (audioKind) {
            case AUDIO_DEVICE_KIND.INPUT:
                try {
                    await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: { exact: deviceId },
                        },
                    });
                    console.info(`Audio input set to ${this.currentAudioInputId}`);
                } catch (err) {
                    console.error(`Error setting audio input: ${err}`);
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.info("Audio input set to default");
                    this.currentAudioInputId = null;
                    localStorage.removeItem("sipcore-audio-input");
                    this.triggerUpdate();
                }
                this.currentAudioInputId = deviceId;
                localStorage.setItem("sipcore-audio-input", deviceId);
                break;
            case AUDIO_DEVICE_KIND.OUTPUT:
                var audioElement = document.querySelector("#remoteAudio") as any;
                try {
                    await audioElement.setSinkId(this.currentAudioOutputId);
                } catch (err) {
                    console.error(`Error setting audio output: ${err}`);
                    this.currentAudioOutputId = null;
                    localStorage.removeItem("sipcore-audio-output");
                    this.triggerUpdate();
                    console.info("Audio output set to default");
                    break;
                }
                this.currentAudioOutputId = deviceId;
                localStorage.setItem("sipcore-audio-output", deviceId);
                break;
        }
    }
}

/** @hidden */
const sipCore = new SIPCore();
sipCore.init().catch((error) => {
    console.error("Error initializing SIP Core:", error);
});
(window as any).sipCore = sipCore;
export { sipCore };
