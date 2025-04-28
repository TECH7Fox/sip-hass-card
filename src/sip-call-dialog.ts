import {
    LitElement,
    html,
    css,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { sipCore, CALLSTATE, AUDIO_DEVICE_KIND } from "./sip-core";
import { AudioVisualizer } from "./audio-visualizer";


interface Extension {
    name: string;
    extension: string;
    camera_entity: string | null;
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


interface PopupConfig {
    buttons: Button[];
    extensions: Extension[];
    large: boolean | undefined;
}


@customElement("sip-call-dialog")
class SIPCallDialog extends LitElement {
    @property()
    public open = false;

    @property()
    public configuratorOpen = false;

    @property()
    public outputDevices: MediaDeviceInfo[] = [];
    
    @property()
    public inputDevices: MediaDeviceInfo[] = [];
    
    @property()
    public hass = sipCore.hass;

    @property()
    public config = sipCore.config.popup_config as PopupConfig;

    @state()
    private audioVisualizer: AudioVisualizer | undefined;

    constructor() {
        super();
        this.setupButton();
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

            ha-dialog {
                --dialog-content-padding: 0;
                --mdc-dialog-min-width: 600px;
            }

            ha-dialog[large] {
                --dialog-content-padding: 0;
                --mdc-dialog-min-width: 90vw;
                --mdc-dialog-max-width: 90vw;
                --mdc-dialog-min-height: 90vh;
                --mdc-dialog-max-height: 90vh;
            }

            ha-camera-stream {
                height: 100%;
                width: 100%;
                display: block;
            }

            @media (max-width: 600px), (max-height: 600px) {
                ha-dialog {
                  --dialog-surface-margin-top: 0px;
                  --mdc-dialog-min-width: calc( 100vw - env(safe-area-inset-right) - env(safe-area-inset-left) );
                  --mdc-dialog-max-width: calc( 100vw - env(safe-area-inset-right) - env(safe-area-inset-left) );
                  --mdc-dialog-min-height: 100%;
                  --mdc-dialog-max-height: 100%;
                  --vertical-align-dialog: flex-end;
                  --ha-dialog-border-radius: 0;
                }
            }

            .accept-button {
                color: var(--label-badge-green);
            }

            .deny-button {
                color: var(--label-badge-red);
            }

            .deny-button, .accept-button, .audio-button {
                --mdc-icon-button-size: 64px;
                --mdc-icon-size: 32px;
            }

            .row {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
            }

            .bottom-row {
                display: flex;
                justify-content: space-between;
                margin: 18px;
            }

            .content {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 300px;
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
        this.open = sipCore.call_state !== CALLSTATE.IDLE;
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
    
    openPopup() {
        this.open = true;
        this.requestUpdate();
    }

    closePopup() {
        this.open = false;
        this.requestUpdate();
    }

    render() {
        let camera: string = "";

        if (sipCore.call_state !== CALLSTATE.IDLE && sipCore.remoteExtension !== null) {
            camera = this.config.extensions.find((extension) => extension.extension === sipCore.remoteExtension)?.camera_entity || "";
        if (!camera) {
                console.log("No camera entity found");
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

        let phoneIcon: string;
        switch (sipCore.call_state) {
            case CALLSTATE.INCOMING:
                phoneIcon = "mdi:phone-incoming";
                break;
            case CALLSTATE.OUTGOING:
                phoneIcon = "mdi:phone-outgoing";
                break;
            case CALLSTATE.CONNECTED:
                phoneIcon = "mdi:phone-in-talk";
                break;
            default:
                phoneIcon = "mdi:phone";
                break;
        }

        return html`
            <ha-dialog ?open=${this.configuratorOpen} @closed=${() => { this.configuratorOpen = false; if (!this.open) this.closePopup(); }} hideActions flexContent .heading=${true} data-domain="camera" ?large=${this.config.large}>
                <ha-dialog-header slot="heading">
                    <ha-icon-button-prev
                        slot="navigationIcon"
                        @click=${() => {
                            this.configuratorOpen = false;
                            this.openPopup();
                        }}>
                    </ha-icon-button-prev>
                    <span slot="title" .title="Call">Call</span>
                </ha-dialog-header>
                <div tabindex="-1" dialogInitialFocus class="form">
                    <ha-select
                        naturalMenuWidth
                        fixedMenuPosition
                        icon
                        label=${"Audio Output"}
                        .value="${sipCore.currentAudioOutputId}"
                        @selected=${this.handleAudioOutputChange}
                        @closed="${(event: { stopPropagation: () => any; }) => event.stopPropagation()}">
                        ${this.outputDevices.map((device) => html`
                            <ha-list-item
                                graphic="icon"
                                .value="${device.deviceId}"
                                ?selected=${sipCore.currentAudioOutputId === device.deviceId}>
                                ${device.label}
                                <ha-icon slot="graphic" .icon=${"mdi:headphones"}></ha-icon>
                            </ha-list-item>
                        `)}
                        <ha-icon slot="icon" .icon=${"mdi:headphones"}></ha-icon>
                    </ha-select>
                    <ha-select
                        naturalMenuWidth
                        fixedMenuPosition
                        icon
                        label=${"Audio Input"}
                        .value="${sipCore.currentAudioInputId}"
                        @selected=${this.handleAudioInputChange}
                        @closed="${(event: { stopPropagation: () => any; }) => event.stopPropagation()}">
                        ${this.inputDevices.map((device) => html`
                            <ha-list-item
                                graphic="icon"
                                .value="${device.deviceId}"
                                ?selected=${sipCore.currentAudioInputId === device.deviceId}>
                                ${device.label}
                                <ha-icon slot="graphic" .icon=${"mdi:microphone"}></ha-icon>
                            </ha-list-item>
                        `)}
                        <ha-icon slot="icon" .icon=${"mdi:microphone"}></ha-icon>
                    </ha-select>
                    <ha-settings-row>
                        <span slot="heading">Logged in as ${sipCore.user.ha_username} <span style="color: gray;">(${sipCore.user.extension})</span></span>
                        <span slot="description">The current user used to log in to the SIP server. You can configure users in the sip-config.json file.</span> 
                    </ha-settings-row>
                </div>
            </ha-dialog>

            <ha-dialog ?open=${this.open} @closed=${this.closePopup} hideActions flexContent .heading=${true} data-domain="camera" ?large=${this.config.large}>
                <ha-dialog-header slot="heading">
                    <ha-icon-button
                        dialogAction="cancel"
                        slot="navigationIcon"
                        label="Close">
                        <ha-icon .icon=${"mdi:close"}></ha-icon>
                    </ha-icon-button>
                    <div slot="title" .title="Call">
                        <span>Call</span>
                        <span style="color: gray; padding-left: 8px;">(${sipCore.user.extension})</span>
                    </div>
                    <ha-icon-button
                        dialogAction="settings"
                        slot="actionItems"
                        label="Settings"
                        @click="${() => {
                            this.configuratorOpen = true;
                            this.requestUpdate();
                        }}">
                        <ha-icon .icon=${"mdi:cog-outline"}></ha-icon>
                    </ha-icon-button>
                    <ha-button-menu
                        corner="BOTTOM_END"
                        menucorner="END"
                        slot="actionItems"
                        fixed
                        @closed="${(event: { stopPropagation: () => any; }) => event.stopPropagation()}"
                    >
                        <ha-icon-button
                            slot="trigger"
                            label="More">
                            <ha-icon .icon=${"mdi:dots-vertical"}></ha-icon>
                        </ha-icon-button>
                        <ha-list-item
                            graphic="icon"
                            hasmeta
                            @click="${() => {
                                window.open("https://tech7fox.github.io/sip-hass-docs", "_blank");
                            }}">
                            Documentation
                            <ha-icon slot="graphic" .icon=${"mdi:bookshelf"}></ha-icon>
                            <ha-icon slot="meta" .icon=${"mdi:open-in-new"}></ha-icon>
                        </ha-list-item>
                    </ha-button-menu>
                </ha-dialog-header>
                <div tabindex="-1" dialogInitialFocus>
                    <div class="content">
                        <div id="audioVisualizer" style="display: ${camera ? "hidden" : "block"}"></div>
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
                            ${this.config.buttons.map((button) => {
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
                                this.closePopup();
                            }}">
                            <ha-icon .icon=${"mdi:phone-off"}></ha-icon>
                        </ha-icon-button>
                    </div>
                </div>
            </ha-dialog>
        `;
    }

    async firstUpdated() {
        this.outputDevices = await sipCore.getAudioDevices(AUDIO_DEVICE_KIND.OUTPUT); // TODO: Move this to sipcore itself?
        this.inputDevices = await sipCore.getAudioDevices(AUDIO_DEVICE_KIND.INPUT);
    }

    private handleAudioInputChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const selectedDeviceId = select.value;
        sipCore.setAudioDevice(selectedDeviceId, AUDIO_DEVICE_KIND.INPUT);
        this.requestUpdate();
    }

    private handleAudioOutputChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const selectedDeviceId = select.value;
        sipCore.setAudioDevice(selectedDeviceId, AUDIO_DEVICE_KIND.OUTPUT);
        this.requestUpdate();
    }

    setupButton() {
        const homeAssistant = document.getElementsByTagName("home-assistant")[0];
        const panel = homeAssistant?.shadowRoot?.querySelector("home-assistant-main")
            ?.shadowRoot?.querySelector("ha-panel-lovelace");

        if (panel === null) {
            console.debug("panel not found!");
            return;
        }

        const actionItems = panel?.shadowRoot?.querySelector("hui-root")?.shadowRoot?.querySelector(".action-items");

        if (actionItems?.querySelector("#sipcore-call-button")) {
            return;
        }

        const callButton = document.createElement("ha-icon-button") as any;
        callButton.label = "Open Call Popup";
        const icon = document.createElement("ha-icon") as any;
        icon.style = "display: flex; align-items: center; justify-content: center;";
        (icon as any).icon = "mdi:phone";
        callButton.slot = "actionItems";
        callButton.id = "sipcore-call-button";
        callButton.appendChild(icon);
        callButton.addEventListener("click", () => {
            this.open = true;
            this.requestUpdate();
        });
        actionItems?.appendChild(callButton);

        window.addEventListener("location-changed", () => {
            console.debug("View changed, setting up button again...");
            this.setupButton();
        })
    }
}
