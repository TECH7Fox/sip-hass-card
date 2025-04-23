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


interface SIPCallCardConfig {
    buttons: Button[];
    extensions: Extension[];
}


class SIPCallCard extends LitElement {

    public hass: any;
    public config: SIPCallCardConfig | undefined;

    static get styles() {
        return css`
            ha-card {
                /* Here you can add your custom styles */
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
        return html`
            <ha-card header="Contacts">
                test 123
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

customElements.define("sip-call-card", SIPCallCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "sip-call-card",
    name: "SIP Call Card",
    preview: true,
    description: "Offical SIP Call Card",
});
