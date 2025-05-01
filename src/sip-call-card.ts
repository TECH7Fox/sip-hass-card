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
    idle_text: string;
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
            ha-card {
                overflow: hidden;
                position: relative;
                height: 100%;
            }

            hui-image {
                width: 100%;
                height: auto;
            }

            ha-icon-button {
                --mdc-icon-button-size: 40px;
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
                transform: scaleY( .5 );
                opacity: .25;
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
                background-color: var(--ha-picture-card-background-color,rgba(0,0,0,.3));
                padding: 4px 8px;
                font-size: 16px;
                color: var(--ha-picture-card-text-color,#fff);
            }

            .footer > div {
                display: flex;
            }

            .both {
                display: flex;
                justify-content: space-between;
            }

            .footer span {
                font-size: 1em;
                align-self: center;
                margin: 0 8px;
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
                <div id="audioVisualizer" style="display: ${sipCore.callState !== CALLSTATE.IDLE && !camera ? "block" : "none"}"></div>
                ${sipCore.callState === CALLSTATE.IDLE ? html`
                    <div class="placeholder">
                        <span>No active call</span>
                    </div>
                ` : camera ? html`
                    <hui-image
                        tabindex="0"
                        .cameraImage=${camera}
                        .hass=${this.hass}
                        .cameraView=${"live"}
                        .aspectRatio=${"16:9"}
                    ></hui-image>
                ` : ""}
                <div class="footer both">
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
                            return html`
                                <ha-icon-button
                                    .icon=${button.icon}
                                    .label=${button.label}
                                    @click=${() => {
                                        if (button.type === ButtonType.SERVICE_CALL) {
                                            this.hass.callService(
                                                button.data.domain,
                                                button.data.service,
                                                button.data.service_data
                                            );
                                        }
                                    }
                                }></ha-icon-button>
                            `;
                        })}
                    </div>
                    <div>
                        <span style="color: gray">${sipCore.callDuration}</span>
                        <ha-icon-button
                            style="color: var(--label-badge-red);"
                            label="End Call"
                            @click="${() => sipCore.endCall()}">
                            <ha-icon .icon=${"mdi:phone-hangup"}></ha-icon>
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
