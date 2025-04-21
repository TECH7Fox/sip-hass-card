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
        console.log("current audio input id", this.currentAudioInputId);
        console.log("current audio output id", this.currentAudioOutputId);
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

    setupPopup() {
        let POPUP_COMPONENT = this.config.popup_config.override_component || "sip-call-dialog";
        if (document.getElementsByTagName(POPUP_COMPONENT).length < 1) {
            this.dialog = document.createElement(POPUP_COMPONENT) as any;
            document.body.appendChild(this.dialog);
        }
    }

    async init() {
        await this.createHassioSession();
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
                console.info("Terminating existing RTC session");
                this.RTCSession.terminate();
            }
            this.RTCSession = e.session;
            this.RTCSession.on("failed", (e: EndEvent) => {
                console.info("Call failed");
                this.call_state = CALLSTATE.IDLE;
            });
            this.RTCSession.on("ended", (e: EndEvent) => {
                console.info("Call ended");
                this.call_state = CALLSTATE.IDLE;
            });
            this.RTCSession.on("accepted", (e: IncomingEvent) => {
                console.info("Call accepted");
                this.call_state = CALLSTATE.CONNECTED;
            });
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
