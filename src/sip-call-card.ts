import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sipCore, CALLSTATE } from "./sip-core";
import { AudioVisualizer } from "./audio-visualizer";

declare global {
    interface Window {
        customCards?: Array<{ type: string; name: string; preview: boolean; description: string }>;
    }
}

interface Extension {
    name: string;
    status_entity: string | null;
    camera_entity: string | null;
    hidden: boolean | null;
    edit: boolean | null;
    override_icon: string | null;
    override_state: string | null;
}

enum ButtonType {
    SERVICE_CALL,
    DTMF,
}

interface Button {
    label: string;
    icon: string;
    type: ButtonType;
    data: any;
}

interface CallCardConfig {
    buttons: Button[];
    extensions: { [key: string]: Extension };
    idle_text: string;
    largeUI: boolean;
}

@customElement("sip-call-card")
class SIPCallCard extends LitElement {
    @property()
    public hass = sipCore.hass;

    @property()
    public config: CallCardConfig | undefined;

    @state()
    private audioVisualizer: AudioVisualizer | undefined;

    setConfig(config: any) {
        this.config = config;
        // TODO: Check if config is valid
    }

    static getStubConfig() {
        return {
            extensions: {
                "100": {
                    name: "John Doe",
                },
                "101": {
                    name: "Joe Smith",
                },
                "102": {
                    name: "Doorbell",
                    override_icon: "mdi:doorbell",
                },
            },
            buttons: [],
        };
    }

    static get styles() {
        return css`
            ha-card {
                overflow: hidden;
                position: relative;
                height: 100%;
            }

            hui-image {
                width: 100%;
                height: auto;
            }

            #remoteVideo {
                width: 100%;
                height: auto;
            }

            ha-icon {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #audioVisualizer {
                min-height: 230px;
                white-space: nowrap;
                align-items: center;
                display: flex;
                justify-content: center;
            }

            #audioVisualizer div {
                display: inline-block;
                width: 3px;
                height: 100px;
                margin: 0 7px;
                background: currentColor;
                transform: scaleY(0.5);
                opacity: 0.25;
            }

            .placeholder {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                background-color: var(--secondary-background-color);
                color: var(--primary-text-color);
                min-height: 230px;
            }

            .footer {
                position: absolute;
                left: 0px;
                right: 0px;
                bottom: 0px;
                background-color: var(--ha-picture-card-background-color, rgba(0, 0, 0, 0.3));
                padding: 4px 8px;
                font-size: 16px;
                color: var(--ha-picture-card-text-color, #fff);
                --mdc-icon-button-size: 40px;
            }

            .footer > div {
                display: flex;
            }

            .both {
                display: flex;
                justify-content: space-between;
            }

            .footer span {
                align-self: center;
                margin: 0 8px;
            }

            .footer[large] {
                font-size: 24px;
                --mdc-icon-button-size: 68px;
                --mdc-icon-size: 42px;
                padding: 14px;
            }

            .footer[large] span {
                margin: 0 16px;
            }
        `;
    }

    updateHandler = (event: any) => {
        this.requestUpdate();

        if (sipCore.remoteVideoStream !== null) {
            const videoElement = this.renderRoot.querySelector("#remoteVideo") as HTMLVideoElement;
            if (videoElement && videoElement.srcObject !== sipCore.remoteVideoStream) {
                videoElement.srcObject = sipCore.remoteVideoStream;
                videoElement.play();
            }
        } else {
            const videoElement = this.renderRoot.querySelector("#remoteVideo") as HTMLVideoElement;
            if (videoElement) {
                videoElement.srcObject = null;
                videoElement.pause();
            }
        }
    };

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("sipcore-update", this.updateHandler);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("sipcore-update", this.updateHandler);
    }

    render() {
        let camera: string = "";
        let statusText;
        let phoneIcon: string;
        let remoteName = this.config?.extensions[sipCore.remoteExtension || ""]?.name || sipCore.remoteName;

        switch (sipCore.callState) {
            case CALLSTATE.IDLE:
                statusText = "No active call";
                phoneIcon = "mdi:phone";
                break;
            case CALLSTATE.INCOMING:
                statusText = "Incoming call from " + remoteName;
                phoneIcon = "mdi:phone-incoming";
                break;
            case CALLSTATE.OUTGOING:
                statusText = "Outgoing call to " + remoteName;
                phoneIcon = "mdi:phone-outgoing";
                break;
            case CALLSTATE.CONNECTED:
                statusText = "Connected to " + remoteName;
                phoneIcon = "mdi:phone-in-talk";
                break;
            case CALLSTATE.CONNECTING:
                statusText = "Connecting to " + remoteName;
                phoneIcon = "mdi:phone";
                break;
            default:
                statusText = "Unknown call state";
                phoneIcon = "mdi:phone";
                break;
        }

        if (
            sipCore.callState !== CALLSTATE.IDLE &&
            sipCore.remoteExtension !== null &&
            sipCore.remoteVideoStream === null
        ) {
            camera = this.config?.extensions[sipCore.remoteExtension]?.camera_entity || "";
            if (!camera) {
                if (sipCore.remoteAudioStream !== null) {
                    if (this.audioVisualizer === undefined) {
                        this.audioVisualizer = new AudioVisualizer(this.renderRoot, sipCore.remoteAudioStream, 16);
                    }
                } else {
                    this.audioVisualizer = undefined;
                }
            }
        }

        return html`
            <ha-card>
                <div id="audioVisualizer" style="display: ${
                    sipCore.callState !== CALLSTATE.IDLE && !camera && sipCore.remoteVideoStream === null
                        ? "flex"
                        : "none"
                }"></div>
                <video poster="noposter" style="display: ${
                    sipCore.remoteVideoStream === null ? "none" : "block"
                }" playsinline id="remoteVideo"></video>
                ${
                    sipCore.callState === CALLSTATE.IDLE
                        ? html`
                              <div class="placeholder">
                                  <span>No active call</span>
                              </div>
                          `
                        : camera
                        ? html`
                              <hui-image
                                  tabindex="0"
                                  .cameraImage=${camera}
                                  .hass=${this.hass}
                                  .cameraView=${"live"}
                                  .aspectRatio=${"16:9"}
                              ></hui-image>
                          `
                        : ""
                }
                <div ?large=${this.config?.largeUI} class="footer both">
                    <div>
                        <ha-icon-button
                            style="color: var(--label-badge-green);"
                            label="Answer call"
                            @click="${() => sipCore.answerCall()}">
                            <ha-icon .icon=${phoneIcon}></ha-icon>
                        </ha-icon-button>
                        <span>${statusText}</span>
                    </div>
                    <div>
                        ${this.config?.buttons.map((button) => {
                            if (button.type === ButtonType.SERVICE_CALL) {
                                return html`
                                    <ha-icon-button
                                        class="audio-button"
                                        label="${button.label}"
                                        @click="${() => {
                                            const { domain, service, ...service_data } = button.data;
                                            this.hass.callService(domain, service, service_data);
                                        }}"
                                    >
                                        <ha-icon .icon=${button.icon}></ha-icon>
                                    </ha-icon-button>
                                `;
                            } else if (button.type === ButtonType.DTMF) {
                                return html`
                                    <ha-icon-button
                                        class="audio-button"
                                        label="${button.label}"
                                        @click="${() => {
                                            sipCore.RTCSession?.sendDTMF(button.data);
                                        }}"
                                    >
                                        <ha-icon .icon=${button.icon}></ha-icon>
                                    </ha-icon-button>
                                `;
                            }
                        })}
                    </div>
                    <div>
                        <ha-icon-button
                            class="audio-button"
                            label="Mute audio"
                            ?disabled="${sipCore.RTCSession === null}"
                            @click="${() => {
                                if (sipCore.RTCSession?.isMuted().audio) sipCore.RTCSession?.unmute({ audio: true });
                                else sipCore.RTCSession?.mute({ audio: true });
                                this.requestUpdate();
                            }}">
                            <ha-icon
                                .icon="${
                                    sipCore.RTCSession !== null && sipCore.RTCSession?.isMuted().audio
                                        ? "mdi:microphone-off"
                                        : "mdi:microphone"
                                }"
                            </ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            class="audio-button"
                            label="Mute video"
                            style="display: ${sipCore.config.sip_video ? "block" : "none"}"
                            ?disabled="${sipCore.RTCSession === null}"
                            @click="${() => {
                                if (sipCore.RTCSession?.isMuted().video) sipCore.RTCSession?.unmute({ video: true });
                                else sipCore.RTCSession?.mute({ video: true });
                                this.requestUpdate();
                            }}">
                            <ha-icon
                                .icon="${
                                    sipCore.RTCSession !== null && sipCore.RTCSession?.isMuted().video
                                        ? "mdi:video-off"
                                        : "mdi:video"
                                }"
                            ></ha-icon>
                        </ha-icon-button>
                    </div>
                    <div>
                        <span style="color: gray">${sipCore.callDuration}</span>
                        <ha-icon-button
                            style="color: var(--label-badge-red);"
                            label="End Call"
                            @click="${() => sipCore.endCall()}">
                            <ha-icon .icon=${"mdi:phone-off"}></ha-icon>
                        </ha-icon-button>
                    </div>
                </div>
            </ha-card>
        `;
    }
}

window.customCards = window.customCards || [];
window.customCards.push({
    type: "sip-call-card",
    name: "SIP Call Card",
    preview: true,
    description: "Offical SIP Call Card",
});
