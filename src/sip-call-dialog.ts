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
            ha-card {
                /* sample css */
            }

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
                phoneIcon = "mdi:phone-incoming-outline";
                break;
            case CALLSTATE.OUTGOING:
                phoneIcon = "mdi:phone-outgoing-outline";
                break;
            case CALLSTATE.CONNECTED:
                phoneIcon = "mdi:phone-in-talk-outline";
                break;
            default:
                phoneIcon = "mdi:phone-outline";
                break;
        }

        return html`
            <ha-dialog ?open=${this.open} @closed=${this.closePopup} hideActions flexContent .heading=${true} data-domain="camera" ?large=${this.config.large}>
                <ha-dialog-header slot="heading">
                    <ha-icon-button
                        dialogAction="cancel"
                        slot="navigationIcon"
                        label="Close">
                        <ha-icon .icon=${"mdi:close"}></ha-icon>
                    </ha-icon-button>
                    <span slot="title" .title="Call">Call</span>
                    <ha-icon-button
                        dialogAction="settings"
                        slot="actionItems"
                        label="Settings">
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
                        <div>custom buttons go here</div>
                        <ha-icon-button
                            class="deny-button"
                            label="End call"
                            @click="${() => {
                                sipCore.endCall();
                                this.closePopup();
                            }}">
                            <ha-icon .icon=${"mdi:phone-off-outline"}></ha-icon>
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

    openPopup() {
        this.open = true;
        this.requestUpdate();
    }

    closePopup() {
        this.open = false;
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
            this.openPopup();
        });
        actionItems?.appendChild(callButton);

        window.addEventListener("location-changed", () => {
            console.debug("View changed, setting up button again...");
            this.setupButton();
        })
    }
}
