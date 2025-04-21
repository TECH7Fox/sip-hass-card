import {
    LitElement,
    html,
    css,
} from "lit";
// TODO: Use customelement decorator
import { sipCore, CALLSTATE, AUDIO_DEVICE_KIND, PopupConfig } from "./sip-core";
// import { AudioVisualizer } from "./audio-visualizer.js";


console.log("Loading SIPCallDialog");


class SIPCallDialog extends LitElement {
    public open: boolean;
    public outputDevices: MediaDeviceInfo[];
    public inputDevices: MediaDeviceInfo[];
    public hass: any;
    public config: PopupConfig;

    constructor() {
        console.log("SIPCallDialog constructor");
        super();
        this.open = false;
        this.config = sipCore.config.popup_config;
        this.hass = sipCore.hass;
        this.outputDevices = [];
        this.inputDevices = [];
        this.setupButton();
    }

    static get properties() {
        return {
            hass: {},
            config: {},
            open: { type: Boolean },
        };
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

            .top-row {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                margin-left: 24px;
                margin-right: 24px;
            }

            .bottom-row {
                display: flex;
                justify-content: space-between;
                margin: 24px;
            }

            .text {
                margin-right: 5px;
            }

            .content {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 300px;
                width: 100%;
                background-color: #2d3033;
            }
        `;
    }

    // connectedCallback() {
    //     super.connectedCallback();
    //     this.updateHandler = (event: any) => {
    //         this.requestUpdate();
    //     }
    //     window.addEventListener('sipcore-update', this.updateHandler);
    // }

    // disconnectedCallback() {
    //     super.disconnectedCallback();
    //     window.removeEventListener('sipcore-update', this.updateHandler);
    // }

    render() {
        let state_title;
        switch (sipCore.call_state) {
            case CALLSTATE.IDLE:
                state_title = "IDLE";
                break;
            case CALLSTATE.INCOMING:
                state_title = `INCOMING CALL FROM ${sipCore.callee}`;
                break;
            case CALLSTATE.OUTGOING:
                state_title = `CALLING ${sipCore.callee}`;
                break;
            case CALLSTATE.CONNECTED:
                state_title = `CONNECTED TO ${sipCore.callee}`;
                break;
            case CALLSTATE.CONNECTING:
                state_title = `CONNECTING TO ${sipCore.callee}`;
                break;
            default:
                state_title = sipCore.call_state;
                break;
        }

        let camera: string | null = null;

        if (sipCore.call_state !== CALLSTATE.IDLE && sipCore.callee !== null) {
            camera = this.config.extensions.find((extension) => extension.extension === sipCore.callee)?.camera_entity || null;
            // } else {
            //     if (sipCore.audioStream !== null) {
            //         if (this.audioVisualizer === undefined) {
            //             this.audioVisualizer = new AudioVisualizer(this.renderRoot, sipCore.audioStream, 16); // TODO: Move to better place
            //         }
            //     } else {
            //         this.audioVisualizer = undefined;
            //     }
            //     camera = false;
            // }
        }

        return html`
            <ha-dialog ?open=${this.open} @closed=${this.closePopup} hideActions flexContent .heading=${true} data-domain="camera">
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
                    <div class="top-row">
                        <h2>${state_title}</h2>
                    </div>
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
                        <div>
                            <ha-icon-button
                                class="deny-button"
                                label="End call"
                                @click="${() => {
                                    console.log("Ending call");
                                    sipCore.endCall();
                                    this.closePopup();
                                }}">
                                <ha-icon .icon=${"mdi:phone-off"}></ha-icon>
                            </ha-icon-button>
                            <ha-button-menu
                                corner="BOTTOM_END"
                                menucorner="END"
                                fixed
                                @closed="${(event: { stopPropagation: () => any; }) => event.stopPropagation()}"
                            >
                                <ha-icon-button
                                    slot="trigger"
                                    label="Audio output"
                                    class="audio-button">
                                    <ha-icon .icon=${"mdi:speaker"}></ha-icon>
                                </ha-icon-button>
                                ${this.outputDevices.map((device) => html`
                                    <ha-list-item
                                        graphic="icon"
                                        @click="${async () => {
                                            await sipCore.setAudioDevice(device.deviceId, AUDIO_DEVICE_KIND.OUTPUT);
                                            this.requestUpdate();
                                        }}">
                                        ${device.label}
                                        ${sipCore.currentAudioOutputId === device.deviceId ? html`
                                            <ha-icon slot="graphic" .icon=${"mdi:check"}></ha-icon>
                                        ` : ''}
                                    </ha-list-item>
                                `)}
                            </ha-button-menu>
                            <ha-button-menu
                                corner="BOTTOM_END"
                                menucorner="END"
                                fixed
                                @closed="${(event: { stopPropagation: () => any; }) => event.stopPropagation()}"
                            >
                                <ha-icon-button
                                    slot="trigger"
                                    label="Audio input"
                                    class="audio-button">
                                    <ha-icon .icon=${"mdi:microphone"}></ha-icon>
                                </ha-icon-button>
                                ${this.inputDevices.map((device) => html`
                                    <ha-list-item
                                        graphic="icon"
                                        @click="${async () => {
                                            await sipCore.setAudioDevice(device.deviceId, AUDIO_DEVICE_KIND.INPUT);
                                            this.requestUpdate();
                                        }}">
                                        ${device.label}
                                        ${sipCore.currentAudioInputId === device.deviceId ? html`
                                            <ha-icon slot="graphic" .icon=${"mdi:check"}></ha-icon>
                                        ` : ''}
                                    </ha-list-item>
                                `)}
                            </ha-button-menu>
                        </div>
                        <ha-icon-button
                            class="accept-button"
                            label="Answer call"
                            @click="${() => sipCore.answerCall()}">
                            <ha-icon .icon=${"mdi:phone"}></ha-icon>
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
        // TODO: Run again when changing views

        console.log("Setting up button");

        const homeAssistant = document.getElementsByTagName("home-assistant")[0];
        const panel = homeAssistant?.shadowRoot?.querySelector("home-assistant-main")
            ?.shadowRoot?.querySelector("ha-panel-lovelace");

        if (panel === null) {
            console.log("panel not found!");
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
    }
}

// @ts-ignore
customElements.define('sip-call-dialog', SIPCallDialog);
