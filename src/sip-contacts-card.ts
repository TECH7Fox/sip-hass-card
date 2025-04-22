import {
    LitElement,
    html,
    css,
} from "lit";
import { sipCore } from "./sip-core";


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


interface SIPContactsCardConfig {
    extensions: { [key: string]: Extension };
    title: string;
    debug: boolean;
    hide_me: boolean;
    state_color: boolean;
}


class SIPContentCard extends LitElement {

    public hass: any;
    public config: SIPContactsCardConfig | undefined;

    static get styles() {
        return css`
            #audioVisualizer {
                min-height: 20em;
                height: 100%;
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

            .wrapper {
                padding: 8px;
                padding-top: 0px;
                padding-bottom: 2px;
            }

            .flex {
                flex: 1;
                margin-top: 6px;
                margin-bottom: 6px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-width: 0;
            }

            .info, .info > * {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .info {
                flex: 1 1 30%;
                cursor: pointer;
                margin-left: 16px;
                margin-right: 8px;
            }

            .editField {
                width: 100%;
                margin-left: 16px;
                margin-right: 8px;
            }

            state-badge {
                flex-shrink: 0;
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('sipcore-update', () => this.requestUpdate());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('sipcore-update', () => this.requestUpdate());
    }

    render() {
        var connection_state = "";
        if (sipCore.RTCSession != null) {
            connection_state = sipCore.RTCSession?.status.toString();
        }

        return html`
            <ha-card header="${this.config?.title || "Contacts"}">
                ${this.config?.debug ? html`
                    <div>
                        username: ${sipCore.user.ha_username}
                        <br>
                        extension: ${sipCore.user.extension}
                        <br>
                        call_state: ${sipCore.call_state}
                        <br>
                        connection_state: ${connection_state}
                        <br>

                        <button
                            id="denyButton"
                            @click="${() => sipCore.endCall()}"
                        >deny</button>
                        <button
                            id="answerButton"
                            @click="${() => sipCore.answerCall()}"
                        >answer</button>
                        <button
                            id="endButton"
                            @click="${() => sipCore.endCall()}"
                        >end</button>
                        <br>
                    </div>
                ` : ""}

                <div class="wrapper">
                    ${Object.entries(this.config?.extensions || {}).map(([number, extension]) => {
                        const isMe = number === sipCore.user.extension;
                        const stateObj = this.hass.states[extension.status_entity || ""] || null;
                        if (extension.hidden) return;
                        if (isMe && this.config?.hide_me) return;
                        const icon = stateObj ? extension.override_icon : (extension.override_icon || "mdi:account");
                        if (extension.edit) {
                            return html`
                                <div class="flex">
                                    <state-badge
                                        .stateObj=${stateObj}
                                        .overrideIcon=${icon}
                                        .stateColor=${this.config?.state_color}
                                    ></state-badge>
                                    <ha-textfield
                                        id="custom_${extension.name}"
                                        .value=${number}
                                        .label=${extension.name}
                                        type="text"
                                        .inputmode="text"
                                        class="editField"
                                    ></ha-textfield>
                                    <mwc-button @click="${() => {
                                        var el = this.shadowRoot?.getElementById(`custom_${extension.name}`) as any;
                                        const customNumber = el.value;
                                        sipCore.startCall(customNumber)
                                    }}">CALL</mwc-button>
                                </div>
                            `;
                        } else {
                            return html`
                                <div class="flex">
                                    <state-badge
                                        .stateObj=${stateObj}
                                        .overrideIcon=${icon}
                                        .stateColor=${this.config?.state_color}
                                    ></state-badge>
                                    <div class="info">${extension.name}</div>
                                    <mwc-button @click="${() => sipCore.startCall(number)}">CALL</mwc-button>
                                </div>
                            `;
                        }
                    })}
                </div>
            </ha-card>
        `;
    }

    // The user supplied configuration. Throw an exception and Home Assistant
    // will render an error card.
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
        }
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return 3;
    }
}

customElements.define("sip-contacts-card", SIPContentCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "sip-contacts-card",
    name: "SIP Contacts Card",
    preview: true,
    description: "Offical SIP Contacts Card to make calls",
});
