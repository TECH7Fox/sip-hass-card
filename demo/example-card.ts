import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";


declare global {
    interface Window {
        customCards?: Array<{ type: string; name: string; preview: boolean; description: string }>;
    }
}


@customElement("sip-example-card")
class ExampleCard extends LitElement {

    @property()
    public sipCore: any;

    static styles = css`
        ha-card {
            padding: 16px;
            font-family: Arial, sans-serif;
        }

        .status {
            margin-bottom: 16px;
        }

        .buttons {
            display: flex;
            gap: 8px;
        }

        button {
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("sipcore-update", this.updateHandler);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("sipcore-update", this.updateHandler);
    }

    private updateHandler = () => {
        if (!this.sipCore) {
            this.sipCore = (window as any).sipCore;
        }
        this.requestUpdate();
    };

    setConfig(config: any) {
        // Validate the config here
    }

    render() {
        if (!this.sipCore) {
            return html`<div>Loading...</div>`;
        }

        return html`
            <ha-card>
                <div class="status">
                    <strong>Call State:</strong> ${this.sipCore.callState}<br />
                    <strong>Call Duration:</strong> ${this.sipCore.callDuration}<br />
                    <strong>Remote Name:</strong> ${this.sipCore.remoteName || "N/A"}<br />
                </div>
                <div class="buttons">
                    <button @click=${() => this.sipCore.answerCall()}>Answer Call</button>
                    <button @click=${() => this.sipCore.endCall()}>End Call</button>
                    <button @click=${() => this.sipCore.startCall("8001")}>Call Extension 8001</button>
                </div>
            </ha-card>
        `;
    }
}

window.customCards = window.customCards || [];
window.customCards.push({
    type: "sip-example-card",
    name: "SIP Example Card",
    preview: true,
    description: "SIP Example Card",
});
