import {
    LitElement,
    html,
    css,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sipCore, CALLSTATE, AUDIO_DEVICE_KIND } from "./sip-core";
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


class ButtonType {
    static SERVICE_CALL = "service_call";
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
                }
            },
            buttons: [],
        }
    }

    static get styles() {
        return css`
            ha-icon[slot="meta"] {
                width: 18px;
                height: 18px;
            }

            ha-icon {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #audioVisualizer {
                min-height: 10em;
                white-space: nowrap;
                align-items: center;
                display: flex;
                justify-content: center;
                padding-top: 2em;
            }

            #audioVisualizer div {
                display: inline-block;
                width: 3px;
                height: 100px;
                margin: 0 7px;
                background: currentColor;
                transform: scaleY( .5 );
                opacity: .25;
            }

            ha-camera-stream {
                height: 100%;
                width: 100%;
                display: block;
            }

            .accept-button {
                color: var(--label-badge-green);
            }

            .deny-button {
                color: var(--label-badge-red);
            }

            .deny-button, .accept-button, .audio-button {
                --mdc-icon-button-size: 40px;
                --mdc-icon-size: 24px;
            }

            .row {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
            }

            .bottom-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 16px;
            }

            .content {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
            }

            .form {
                display: flex;
                flex-direction: column;
                padding: 16px;
            }

            ha-select {
                margin: 8px 0;
            }
        `;
    }

    updateHandler = (event: any) => {
        this.requestUpdate();
    }
    
    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('sipcore-update', this.updateHandler);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('sipcore-update', this.updateHandler);
    }

    render() {
        let camera: string = "";
        let statusText;
        let phoneIcon: string;

        switch (sipCore.callState) {
            case CALLSTATE.IDLE:
                statusText = "No active call";
                phoneIcon = "mdi:phone";
                break;
            case CALLSTATE.INCOMING:
                statusText = "Incoming call from " + sipCore.remoteName;
                phoneIcon = "mdi:phone-incoming";
                break;
            case CALLSTATE.OUTGOING:
                statusText = "Outgoing call to " + sipCore.remoteName;
                phoneIcon = "mdi:phone-outgoing";
                break;
            case CALLSTATE.CONNECTED:
                statusText = "Connected to " + sipCore.remoteName;
                phoneIcon = "mdi:phone-in-talk";
                break;
            case CALLSTATE.CONNECTING:
                statusText = "Connecting to " + sipCore.remoteName;
                phoneIcon = "mdi:phone";
                break;
            default:
                statusText = "Unknown call state";
                phoneIcon = "mdi:phone";
                break;
        }

        if (sipCore.callState !== CALLSTATE.IDLE && sipCore.remoteExtension !== null) {
            camera = this.config?.extensions[sipCore.remoteExtension]?.camera_entity || "";
        if (!camera) {
                if (sipCore.remoteAudioStream !== null) {
                    console.log("Audio stream found");
                    if (this.audioVisualizer === undefined) {
                        console.log("Creating audio visualizer");
                        this.audioVisualizer = new AudioVisualizer(this.renderRoot, sipCore.remoteAudioStream, 16);
                    }
                } else {
                    this.audioVisualizer = undefined;
                }
            }
        }

        return html`
            <ha-card>
                <div tabindex="-1" dialogInitialFocus>
                    <div class="content">
                        <div id="audioVisualizer" style="display: ${camera ? "none" : "block"}"></div>
                        ${camera ? html`
                            <ha-camera-stream
                                allow-exoplayer
                                muted
                                .hass=${this.hass}
                                .stateObj=${this.hass.states[camera]}
                            ></ha-camera-stream>
                        ` : ""}
                    </div>
                    <div class="bottom-row">
                        <ha-icon-button
                            class="accept-button"
                            label="Answer call"
                            @click="${() => sipCore.answerCall()}">
                            <ha-icon .icon=${phoneIcon}></ha-icon>
                        </ha-icon-button>
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
                                            }}">
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
                                    if (sipCore.RTCSession?.isMuted().audio)
                                        sipCore.RTCSession?.unmute({audio: true});
                                    else
                                        sipCore.RTCSession?.mute({audio: true});
                                    this.requestUpdate();
                                }}">
                                <ha-icon
                                    .icon="${(sipCore.RTCSession !== null && sipCore.RTCSession?.isMuted().audio) ? "mdi:microphone-off" : "mdi:microphone"}"
                                </ha-icon>
                            </ha-icon-button>
                            <ha-icon-button
                                class="audio-button"
                                label="Mute video"
                                ?disabled="${sipCore.RTCSession === null}"
                                @click="${() => {
                                    if (sipCore.RTCSession?.isMuted().video)
                                        sipCore.RTCSession?.unmute({video: true});
                                    else
                                        sipCore.RTCSession?.mute({video: true});
                                    this.requestUpdate();
                                }}">
                                <ha-icon
                                    .icon="${(sipCore.RTCSession !== null && sipCore.RTCSession?.isMuted().video) ? "mdi:video-off" : "mdi:video"}"
                                ></ha-icon>
                            </ha-icon-button>
                        </div>
                        <ha-icon-button
                            class="deny-button"
                            label="End call"
                            @click="${() => {
                                sipCore.endCall();
                            }}">
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
