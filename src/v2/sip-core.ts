import { UA, WebSocketInterface } from "jssip/lib/JsSIP";
import { RTCSessionEvent, CallOptions } from "jssip/lib/UA";
import { EndEvent, PeerConnectionEvent, IncomingEvent, OutgoingEvent, IceCandidateEvent, RTCSession } from "jssip/lib/RTCSession";
// load sip-call-dialog
import "./sip-call-dialog";

const version = "0.1.3";

console.info(
    `%c SIP-CORE %c ${version} `,
    'color: white; background: dodgerblue; font-weight: 700;',
    'color: dodgerblue; background: white; font-weight: 700;',
);


export class CALLSTATE {
    static IDLE = "idle";
    static INCOMING = "incoming";
    static OUTGOING = "outgoing";
    static CONNECTING = "connecting";
    static CONNECTED = "connected";
}


class ButtonType {
    static SERVICE_CALL = "service_call";
}


export class AUDIO_DEVICE_KIND {
    static INPUT = "audioinput";
    static OUTPUT = "audiooutput";
}


interface User {
    ha_username: string;
    extension: string;
    password: string
}


interface Extension {
    name: string;
    extension: string;
    icon: string | null;
    status_entity: string | null;
    camera_entity: string | null;
}


interface Button {
    label: string;
    icon: string;
    type: ButtonType;
    data: any;
}


interface PopupConfig {
    enabled: boolean;
    override_component: string | null;
    buttons: Button[];
    extensions: Extension[];
}


interface SIPCoreConfig {
    ice_config: any;
    backup_user: User;
    users: User[];
    auto_answer: boolean;
    popup_config: PopupConfig;
}


class SIPCore {
    private ua: UA;
    public hass: any;
    public user: User;
    public call_state: string = CALLSTATE.IDLE;
    public registered: boolean = false;
    public callee: string | null = null;
    public config: SIPCoreConfig;
    private heartBeatIntervalMs: number = 30000;
    public RTCSession: RTCSession | null = null;
    private wssUrl: string;
    private callOptions: CallOptions;
    private dialog: any | null = null;
    public currentAudioInputId: string | null = localStorage.getItem("sipcore-audio-input") || null;
    public currentAudioOutputId: string | null = localStorage.getItem("sipcore-audio-output") || null;

    constructor() {
        // Get hass instance
        const homeAssistant = document.querySelector("home-assistant");
        if (!homeAssistant) {
            throw new Error("Home Assistant element not found");
        }
        this.hass = (homeAssistant as any).hass;

        // Determine websocket URL
        const ingressEntry = this.hass.states["text.asterisk_addon_ingress_entry"]?.state;
        if (!ingressEntry) {
            throw new Error("Ingress entry not found");
        }
        const wssProtocol = window.location.protocol == "https:" ? "wss" : "ws";
        this.wssUrl = `${wssProtocol}://${window.location.host}${ingressEntry}/ws`;

        this.config = this.fetchConfig();

        // Get current user
        this.user = this.config.users.find(user => user.ha_username === this.hass.user.name) || this.config.backup_user;

        console.info(`Selected user: ${this.user.ha_username} (${this.user.extension})`);

        this.callOptions = {
            mediaConstraints: {
                audio: true,
                video: false,
            },
            rtcConstraints: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: false,
            },
            pcConfig: this.config.ice_config,
        }

        this.ua = this.setupUA();
    }

    async setupAudio() {
        // TODO: Set default audio devices if not set

        let audioElement = document.createElement("audio") as any;
        audioElement.id = "remoteAudio";
        audioElement.autoplay = true;
        audioElement.style.display = "none";
        document.body.appendChild(audioElement);
        console.info("Audio element created:", audioElement);
        // set output device
        // if (this.currentAudioOutputId) {
        //     audioElement = document.querySelector("#remoteAudio") as any;
        //     console.log("Audio element found:", audioElement);
        //     await audioElement.setSinkId(this.currentAudioOutputId);
        //     console.info(`Audio output set to ${this.currentAudioOutputId}`);
        // }
        // set input device
        // if (this.currentAudioInputId) {
        //     this.callOptions.mediaConstraints.audio = {
        //         deviceId: { exact: this.currentAudioInputId },
        //     };
        //     console.info(`Audio input set to ${this.currentAudioInputId}`);
        // }
    }

    setupPopup() {
        let POPUP_COMPONENT = this.config.popup_config.override_component || "sip-call-dialog";
        if (document.getElementsByTagName(POPUP_COMPONENT).length < 1) {
            this.dialog = document.createElement(POPUP_COMPONENT) as any;
            document.body.appendChild(this.dialog);
        }
    }

    async init() {
        await this.createHassioSession();
        await this.setupAudio();
        console.info(`Connecting to ${this.wssUrl}...`);
        this.ua.start();
        if (this.config.popup_config.enabled) {
            this.setupPopup();
        }
    }

    fetchConfig(): SIPCoreConfig {
        const request = new XMLHttpRequest();
        request.open("GET", `/local/sip-config.json?${new Date().getTime()}`, false);
        request.send(null);
    
        if (request.status === 200) {
            const config: SIPCoreConfig = JSON.parse(request.responseText);
            console.info("Config fetched:", config);
            return config;
        } else {
            throw new Error(`Failed to fetch config: ${request.statusText}`);
        }
    }

    answerCall() {
        this.RTCSession?.answer(this.callOptions);
    }

    endCall() {
        this.RTCSession?.terminate();
    }

    startCall(extension: string) {
        // TODO: Set callee
        this.callee = extension;
        this.ua.call(extension, this.callOptions);
    }

    setupUA(): UA {
        const socket = new WebSocketInterface(this.wssUrl);
        const ua = new UA({
            sockets: [socket],
            uri: `${this.user.extension}@${window.location.host}`, // TODO: Use window.location.host or configurable server?
            authorization_user: this.user.extension,
            display_name: this.user.ha_username, // TODO: This
            password: this.user.password,
            register: true,
        });

        ua.on("registered", (e) => {
            console.info("Registered");
            this.registered = true;
            this.call_state = CALLSTATE.IDLE;

            // Start heartbeat
            setInterval(() => { // TODO: Stop when unregistered? Using heartbeatHandle int?
                if (this.registered) {
                    console.info("Sending heartbeat");
                    socket.send("\n\n");
                }
            }, this.heartBeatIntervalMs);
        })
        ua.on("registrationFailed", (e) => {
            console.warn("Registration failed:", e);
            this.registered = false;
            this.call_state = CALLSTATE.IDLE;
        })
        ua.on("newRTCSession", (e: RTCSessionEvent) => {
            console.info(`New RTC Session: ${e.originator}`);

            if (this.RTCSession !== null) {
                console.info("Terminating new RTC session");
                e.session.terminate();
                return;
            }
            this.RTCSession = e.session;

            e.session.on("failed", (e: EndEvent) => {
                console.info("Call failed");
                this.call_state = CALLSTATE.IDLE;
            });
            e.session.on("ended", (e: EndEvent) => {
                console.info("Call ended");
                this.call_state = CALLSTATE.IDLE;
            });
            e.session.on("accepted", (e: IncomingEvent) => {
                console.info("Call accepted");
                this.call_state = CALLSTATE.CONNECTED;
            });
            e.session.on("peerconnection", (e: PeerConnectionEvent) => {
                console.info("Peer connection established");
                // this.call_state = CALLSTATE.CONNECTING;

                var iceCandidateTimeout: NodeJS.Timeout | null = null;
                var iceTimeout = this.config.ice_config.iceGatheringTimeout || 5000;
                console.info("ICE gathering timeout:", iceTimeout);

                e.peerconnection.addEventListener("icecandidate", (e: RTCPeerConnectionIceEvent) => {
                    console.info("ICE candidate:", e.candidate?.candidate);
                    if (iceCandidateTimeout != null) {
                        clearTimeout(iceCandidateTimeout);
                    }

                    iceCandidateTimeout = setTimeout(() => {
                        console.warn("ICE stopped gathering candidates due to timeout");
                        // TODO: Handle this
                    }, iceTimeout);

                });

                e.peerconnection.addEventListener("iceconnectionstatechange", (e: any) => {
                    console.info("ICE connection state changed:", e.target?.iceGatheringState);
                    if (e.target?.iceGatheringState === "complete") {
                        console.info("ICE gathering complete. Stopping timeout...");
                        if (iceCandidateTimeout != null) {
                            clearTimeout(iceCandidateTimeout);
                        }
                    }
                });

                e.peerconnection.addEventListener("track", async (e: RTCTrackEvent) => {
                    console.info("Track event:", e);

                    let stream: MediaStream | null = null;
                    if (e.streams.length > 0) {
                        console.log(`Received remote streams amount: ${e.streams.length}. Using first stream...`);
                        stream = e.streams[0];
                    }
                    else {
                        console.log("No associated streams. Creating new stream...");
                        stream = new MediaStream();
                        stream.addTrack(e.track);
                    }

                    let remoteAudio = document.getElementById("remoteAudio") as HTMLAudioElement;
                    if (e.track.kind === 'audio' && remoteAudio.srcObject != stream) {
                        remoteAudio.srcObject = stream;
                        try {
                            await remoteAudio.play();
                        }
                        catch (err) {
                            console.log('Error starting audio playback: ' + err);
                        }
                    }
                });
            });

            switch (e.session.direction) {
                case "incoming":
                    console.info("Incoming call");
                    this.call_state = CALLSTATE.INCOMING;
                    if (this.config.auto_answer) {
                        console.info("Auto answering call...");
                        this.answerCall();
                    }
                    break;
                case "outgoing":
                    console.info("Outgoing call");
                    this.call_state = CALLSTATE.OUTGOING;
                    break;
            }
        });
        return ua;
    }

    // borrowed from https://github.com/lovelylain/ha-addon-iframe-card/blob/main/src/hassio-ingress.ts
    setIngressCookie(session: string): string {
        document.cookie = `ingress_session=${session};path=/api/hassio_ingress/;SameSite=Strict${
          location.protocol === "https:" ? ";Secure" : ""
        }`;
        return session;
    };

    async createHassioSession(): Promise<string> {
        const resp: { session: string } = await this.hass.callWS({
            type: "supervisor/api",
            endpoint: "/ingress/session",
            method: "post",
        });
        return this.setIngressCookie(resp.session);
    };

    async validateHassioSession(session: string) {
        await this.hass.callWS({
            type: "supervisor/api",
            endpoint: "/ingress/validate_session",
            method: "post",
            data: { session },
        });
        this.setIngressCookie(session);
    };

    async getAudioDevices(audioKind: AUDIO_DEVICE_KIND) {
        // first get permission to use audio devices
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind == audioKind);
    }

    async setAudioDevice(deviceId: string, audioKind: AUDIO_DEVICE_KIND) {
        console.info(`Setting audio device ${deviceId} (${audioKind})`);
        switch (audioKind) {
            case AUDIO_DEVICE_KIND.INPUT:
                this.currentAudioInputId = deviceId;
                localStorage.setItem("sipcore-audio-input", deviceId);
                // TODO: THIS
                break;
            case AUDIO_DEVICE_KIND.OUTPUT:
                this.currentAudioOutputId = deviceId;
                localStorage.setItem("sipcore-audio-output", deviceId);
                // TODO: THIS
                break;
        }
    }
}

const sipCore = new SIPCore();
sipCore.init().catch((error) => {
    console.error("Error initializing SIP Core:", error);
    console.log(error);
});
export { sipCore, PopupConfig };
