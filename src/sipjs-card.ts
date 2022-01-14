// @ts-nocheck

import { Web } from "sip.js/lib/index.js";
import {
  LitElement,
  html,
  css
} from "lit-element";

class SIPjsClientCard extends LitElement {
    simpleUser: Web.SimpleUser;
    config: any;
    hass: any;
    toneAudio: any;
    nameElement: any;
    timerElement: any;
    renderRoot: any;
    stateElement: any;
    intervalId: number;
    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }
    static get styles() {
        return css `
    :host {
      display: flex;
      align-items: center;
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
    .info {
      flex: 1 1 30%;
      cursor: pointer;
      margin-left: 16px;
      margin-right: 8px;
    }
    state-badge {
      cursor: pointer;
    }
    .secondary {
      color: var(--secondary-text-color);
    }
    .good {
      color: var(--label-badge-green);
    }
    .warning {
      color: var(--label-badge-yellow);
    }
    .critical {
      color: var(--label-badge-red);
    }
    .icon {
      width: 40px;
      height: 40px;
    }
    .video {
      width: 100%;
      height: auto;
    }`;
    }
    render() {
        return html `
              <ha-card>
              <audio id="remoteAudio" style="display:none"></audio>
              <audio id="toneAudio" style="display:none" loop controls></audio>
              <div class="wrapper">
              <h2 style="text-align: center; padding-top: 15px; margin-top: 0;" id="name">Idle</h2>
              <span style="float:left" id="state">Connecting</span>
              <span style="float:right" id="time">00:00</span>
              ${this.config.video ? html `<video class="video" id="remoteVideo"></video>` : ''}
              <br><hr style="margin-bottom: 12px;">
              <mwc-button outlined @click=${() => this._answer()} style="float: right;">
                  <svg class="icon" viewBox="0 0 24 24">
                    <path fill="limegreen" d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z">
                    </path>
                  </svg>
              </mwc-button>
              <mwc-button outlined @click=${() => this._hangup()} style="float: left;">
                <svg class="icon" viewBox="0 0 24 24">
                    <path fill="red" d="M12,9C10.4,9 8.85,9.25 7.4,9.72V12.82C7.4,13.22 7.17,13.56 6.84,13.72C5.86,14.21 4.97,14.84 4.17,15.57C4,15.75 3.75,15.86 3.5,15.86C3.2,15.86 2.95,15.74 2.77,15.56L0.29,13.08C0.11,12.9 0,12.65 0,12.38C0,12.1 0.11,11.85 0.29,11.67C3.34,8.77 7.46,7 12,7C16.54,7 20.66,8.77 23.71,11.67C23.89,11.85 24,12.1 24,12.38C24,12.65 23.89,12.9 23.71,13.08L21.23,15.56C21.05,15.74 20.8,15.86 20.5,15.86C20.25,15.86 20,15.75 19.82,15.57C19.03,14.84 18.14,14.21 17.16,13.72C16.83,13.56 16.6,13.22 16.6,12.82V9.72C15.15,9.25 13.6,9 12,9Z" />
                </svg>
              </mwc-button>
              <br><br>
              ${this.config.entities.map(ent => {
                const stateObj = this.hass.states[ent.entity]; // filter: grayscale(1); FOR VIDEO
                if (!stateObj) {
                    return html `
                        <div class="not-found">Entity ${ent.entity} not found.</div>
                    `;
                }
                var isMe = false;
                if (this.hass.user.id == this.hass.states[ent.person].attributes.user_id) {
                    isMe = true;
                }
                return html `
                    <div class="flex">
                    <state-badge .stateObj="${stateObj}" icon></state-badge>
                    <div class="info ${isMe ? "good" : ""}">${this.hass.states[ent.person].attributes.id}</div>
                    ${isMe ? html `<mwc-button disabled .hass=${this.hass} .config=${this.config} @click="${() => this._click(ent)}">CALL</mwc-button>` 
                        : html `<mwc-button .hass=${this.hass} .config=${this.config} @click="${() => this._click(ent)}">CALL</mwc-button>`}
                    </div>
                `;
              })}
              ${this.config.custom ?
                this.config.custom.map(custom => {
                  return html `
                    <div class="flex">
                    <div class="info">${custom.name}</div>
                    <mwc-button .hass=${this.hass} .config=${this.config} @click="${() => this._call(custom.number)}">CALL</mwc-button>
                    </div>
                  `;
                }) : ""
              }
              ${this.config.dtmfs ?  
                  this.config.dtmfs.map(dtmf => {
                    return html `
                      <div class="flex">
                      <div class="info">${dtmf.name}</div>
                      <mwc-button .hass=${this.hass} .config=${this.config} @click="${() => this._sendDTMF(dtmf.signal)}">SEND</mwc-button>
                      </div>
                    `;
                  }) : ""
                }
        </div>
        </ha-card>
        `;
    }
    firstUpdated() {
        this.connect();
    }
    setConfig(config) {
        if (!config.server) {
            throw new Error("You need to define a server");
        }
        if (!config.entities) {
            throw new Error("You need to define entities");
        }
        this.config = config;
        this.connect;
    }
    static async getConfigElement() {
        return document.createElement("sipjs-card-editor");
    }

    // static getStubConfig() {
    //     // Return a minimal configuration that will result in a working card configuration
    //     return {
    //         server: "localhost",
    //         port: "8089"
    //     };
    // }

    getCardSize() {
        return this.config.entities.length + 2;
    }
    async _click(ent) {
        if (this.config.backtone) {
            this.toneAudio.src = this.config.backtone;
            this.toneAudio.currentTime = 0;
            this.toneAudio.play();
        }
        this.nameElement.innerHTML = "Calling..."
        var inviterOptions: any = {}
        if (this.config.earlyMedia) {
            inviterOptions.earlyMedia = true;
        }
        await this.simpleUser.call("sip:" + ent.entity.match(/\d/g).join("") + "@" + this.config.server, inviterOptions);
    }
    async _call(number) {
        if (this.config.backtone) {
            this.toneAudio.src = this.config.backtone;
            this.toneAudio.currentTime = 0;
            this.toneAudio.play();
        }
        this.nameElement.innerHTML = "Calling..."
        var inviterOptions: any = {}
        if (this.config.earlyMedia) {
            inviterOptions.earlyMedia = true;
        }
        await this.simpleUser.call("sip:" + number + "@" + this.config.server, inviterOptions);
    }
    async _answer() {
        await this.simpleUser.answer();
    }
    async _hangup() {
        await this.simpleUser.hangup();
    }
    async _sendDTMF(signal) {
        await this.simpleUser.sendDTMF(signal);
    }
    async connect() {
        this.timerElement = this.renderRoot.querySelector('#time');
        this.nameElement = this.renderRoot.querySelector('#name');
        this.stateElement = this.renderRoot.querySelector('#state');
        this.toneAudio = this.renderRoot.querySelector('#toneAudio');

        var aor = "";
        var authorizationUsername = "";
        var authorizationPassword = "";
        console.log(this.hass);
        this.config.entities.map(ent => {
            var extension = ent.entity.match(/\d/g).join("");
            var person = this.hass.states[ent.person];
            if (this.hass.user.id == person.attributes.user_id) {
                aor = "sip:" + extension + "@" + this.config.server;
                authorizationUsername = extension;
                authorizationPassword = ent.secret;
            }
        });

        var options: Web.SimpleUserOptions = {
            aor: aor,
            media: {
                remote: {
                    audio: this.renderRoot.querySelector("#remoteAudio"),
                }
            },
            userAgentOptions: {
                authorizationPassword,
                authorizationUsername,
            }
        };

        if (this.config.video) {
            options.media.remote.video = this.renderRoot.querySelector('#remoteVideo');
        }

        var port = "8089";

        if (this.config.port) {
            port = this.config.port;
        }
        
        this.simpleUser = new Web.SimpleUser("wss://" + this.config.server + ":" + port + "/ws", options);
        
        await this.simpleUser.connect();
        this.stateElement.innerHTML = "connected";

        await this.simpleUser.register();
        this.stateElement.innerHTML = "registered";

        this.simpleUser.delegate = {
            onCallReceived: async () => {
                if (this.config.ringtone) {
                    this.toneAudio.src = this.config.ringtone;
                    this.toneAudio.currentTime = 0;
                    this.toneAudio.play();
                }
                if (this.simpleUser.session._assertedIdentity) {
                    this.nameElement.innerHTML = "Incoming call: " + this.simpleUser.session._assertedIdentity._displayName;
                } else {
                    this.nameElement.innerHTML = "Incoming call. "; 
                }
                if (this.config.autoAnswer) {
                    await this.simpleUser.answer();
                }
            },
            onCallAnswered: () => {
                this.toneAudio.pause();
                console.log(this.simpleUser.session);
                if (this.simpleUser.session._assertedIdentity) {
                    this.nameElement.innerHTML = this.simpleUser.session._assertedIdentity._displayName;
                } else {
                    this.nameElement.innerHTML = "Connected";
                }
                var time = new Date();
                this.intervalId = window.setInterval(function(){
                    var delta = Math.abs(new Date() - time) / 1000;
                    var minutes = Math.floor(delta / 60) % 60;
                    delta -= minutes * 60;
                    var seconds = delta % 60;
                    this.timerElement.innerHTML =  (minutes + ":" + Math.round(seconds)).split(':').map(e => `0${e}`.slice(-2)).join(':');
                  }.bind(this), 1000);
            },
            onCallHangup: () => {
                this.toneAudio.pause();
                this.nameElement.innerHTML = "Idle";
                clearInterval(this.intervalId);
                this.timerElement.innerHTML = "00:00";
            }
        };
    }
}
customElements.define('sipjs-card', SIPjsClientCard);

class ContentCardEditor extends LitElement {

    setConfig(config) {
        this._config = config;
    }

    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }

    configChanged(newConfig) {   
        const event = new Event("config-changed", {
            bubbles: true,
            composed: true
        });
        event.detail = {config: newConfig};
        this.dispatchEvent(event);
    }

    _valueChanged(ev) {
        if (!this._config || !this.hass) {
            return;
        }
        const target = ev.target;
        const value = target.checked !== undefined
            ? target.checked
            : target.value

        this._config = {
            ...this._config,
            [target.configValue]: value
        };

        this.configChanged(this._config);
    }

    private _goBack(): void {
        this._rowEditor = undefined;
        this.requestUpdate();
    }

    render() {
        if (!this._config || !this.hass) {
            return;
        }

        if (this._rowEditor !== undefined) {
            var ent = this._config[this._rowEditor.key][this._rowEditor.index];
            switch (this._rowEditor.key) {
                case "entities":
                    var rowEditor = html`
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Person"}"
                            .index=${this._rowEditor.index}
                            .value="${ent.person!}"
                            .configValue=${"person"}
                            .configKey="${"entities"}"
                            .includeDomains="${"person"}"
                            @value-changed="${this._editArray}"
                            allow-custom-entity
                        ></ha-entity-picker>
                        <paper-input
                            .label=${"Name"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.name!}"
                            .configValue="${"name"}"
                            .configKey="${"entities"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <paper-input
                            .label=${"Extension"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.extension!}"
                            .configValue="${"extension"}"
                            .configKey="${"entities"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <paper-input
                            .label=${"Secret"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.secret!}"
                            .configValue="${"secret"}"
                            .configKey="${"entities"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Status Entity"}"
                            .index=${this._rowEditor.index}
                            .value="${ent.entity!}"
                            .configValue=${"entity"}
                            .configKey="${"entities"}"
                            @value-changed="${this._editArray}"
                            allow-custom-entity
                        ></ha-entity-picker>
                    `;
                break;
                case "dtmfs":
                    var rowEditor = html`
                        <paper-input
                            .label=${"Name"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.name!}"
                            .configValue="${"name"}"
                            .configKey="${"dtmfs"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <paper-input
                            auto-validate pattern="[0-9]*"
                            error-message="numbers only!"
                            maxlength="1"
                            .label=${"Signal"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.signal!}"
                            .configValue="${"signal"}"
                            .configKey="${"dtmfs"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                    `;
                break;
            }
            return html`
                <div class="header">
                    <div class="back-title">
                        <ha-icon-button
                            .label=${"Go Back"}
                            @click=${this._goBack}
                            ><ha-icon icon="hass:arrow-left"></ha-icon>
                        </ha-icon-button>
                        <span slot="title">Card Editor</span>
                    </div>
                </div>
                ${rowEditor}
            `;
        }
        return html`
            <div class="card-config">
                <paper-input
                    label="Server"
                    .value="${this._config.server}"
                    .configValue="${"server"}"
                    @value-changed="${this._valueChanged}"
                ></paper-input>
                <paper-input
                    label="Port"
                    .value="${this._config.port}"
                    .configValue="${"port"}"
                    @value-changed="${this._valueChanged}"
                ></paper-input>
                <div class="side-by-side">
                    <ha-formfield
                        .label=${"Auto Answer"}
                        ><ha-switch
                            .checked=${this._config!.auto_answer !== false}
                            .configValue=${"auto_answer"}
                            @change=${this._valueChanged}
                        ></ha-switch>
                    </ha-formfield>
                    <ha-formfield
                        .label=${"Video"}
                        ><ha-switch
                            .checked=${this._config!.video !== false}
                            .configValue=${"video"}
                            @change=${this._valueChanged}
                        ></ha-switch>
                    </ha-formfield>
                </div>
                <div class="entities">
                    <h3>Extensions (required)</h3>
                    ${this._config.entities ? this._config.entities.map((ent, index) => {
                        return html`
                            <div class="entity">
                                <ha-entity-picker
                                    .hass="${this.hass}"
                                    .label="${"Person"}"
                                    .index=${index}
                                    .value="${ent.person}"
                                    .configValue=${"person"}
                                    .includeDomains="${"person"}"
                                    .configKey="${"entities"}"
                                    @value-changed="${this._editArray}"
                                    allow-custom-entity
                                ></ha-entity-picker>
                                <ha-icon-button 
                                    class="remove-icon"
                                    .label=${"Remove Extension"}
                                    .configKey="${"entities"}"
                                    @click="${this._removeRow}"
                                    .index="${index}"
                                    ><ha-icon icon="hass:close"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button 
                                    class="edit-icon"
                                    .label=${"Edit Extension"}
                                    .configKey="${"entities"}"
                                    @click="${this._editRow}"
                                    .index="${index}"
                                    ><ha-icon icon="hass:pencil"></ha-icon>
                                </ha-icon-button>
                            </div>
                        `;
                    }) : null}
                    <ha-entity-picker
                        .hass="${this.hass}"
                        .label="${"Person"}"
                        .includeDomains="${"person"}"
                        .configValue="${"person"}"
                        .configKey="${"entities"}"
                        @value-changed=${this._addRow}
                        allow-custom-entity
                    ></ha-entity-picker>
                </div>
                <div class="entities">
                    <h3>DTMF's</h3>
                    ${this._config.dtmfs ? this._config.dtmfs.map((ent, index) => {
                        return html`
                            <div class="entity">
                                <paper-input
                                    .hass="${this.hass}"
                                    .label="${"Name"}"
                                    .index=${index}
                                    .value="${ent.name}"
                                    .configValue=${"name"}
                                    .configKey="${"dtmfs"}"
                                    @value-changed="${this._editArray}"
                                ></paper-input>
                                <ha-icon-button 
                                    class="remove-icon"
                                    .label=${"Remove DTMF"}
                                    .configKey="${"dtmfs"}"
                                    @click="${this._removeRow}"
                                    .index="${index}"
                                    ><ha-icon icon="hass:close"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button 
                                    class="edit-icon"
                                    .label=${"Edit DTMF"}
                                    .configKey="${"dtmfs"}"
                                    @click="${this._editRow}"
                                    .index="${index}"
                                    ><ha-icon icon="hass:pencil"></ha-icon>
                                </ha-icon-button>
                            </div>
                        `;
                    }) : null}
                    <paper-input
                        .hass="${this.hass}"
                        .label="${"Name"}"
                        .configValue="${"name"}"
                        .configKey="${"dtmfs"}"
                        @focusout=${this._addRow}
                    ></paper-input>
                </div>
            </div>
        `;
    }

    private _addRow(ev): void {
        if (ev.target.value == "") {
            return;
        }
        var key = ev.target.configKey;
        var array = Object.assign([], this._config[key]);
        array.push({
            [ev.target.configValue]: ev.target.value
        });
        this._config = {
            ...this._config,
            [key]: array
        };
        ev.target.value = null;
        this.configChanged(this._config);
        this.requestUpdate();
    }

    private _removeRow(ev): void {
        var key = (ev.currentTarget as any).configKey;
        var index = (ev.currentTarget as any).index;
        var array = Object.assign([], this._config[key]);
        array.splice(index, 1);
        this._config = {
            ...this._config,
            [key]: array
        };
        this.configChanged(this._config);
        this.requestUpdate();
    }

    private _editRow(ev): void {
        var key = (ev.currentTarget as any).configKey;
        const index = (ev.currentTarget as any).index;
        this._rowEditor = {
            key: key,
            index: index
        }
        this.requestUpdate();
    }

    private _editArray(ev): void {
        var key = ev.target.configKey;
        var index = ev.target.index;
        var array = Object.assign([], this._config[key]);
        array[index] = {
            ...array[index],
            [ev.target.configValue]: ev.target.value
        };
        this._config = {
            ...this._config,
            [key]: array
        };
        this.configChanged(this._config);
    }

    static get styles() {
        return css`
            ha-switch {
                padding: 16px 6px;
            }
            .side-by-side {
                display: flex;
                flex-flow: row wrap;
            }
            .side-by-side > * {
                padding-right: 8px;
                width: 50%;
                flex-flow: column wrap;
                box-sizing: border-box;
            }
            .side-by-side > *:last-child {
                flex: 1;
                padding-right: 0;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .back-title {
                display: flex;
                align-items: center;
                font-size: 18px;
            }
            ha-icon, .entity {
                display: flex;
                align-items: center;
            }
            .entity ha-entity-picker, paper-input {
                flex-grow: 1;
            }
            .entity handle {
                padding-right: 8px;
                cursor: move;
            }
            .remove-icon, .edit-icon {
                --mdc-icon-button-size: 36px;
                color: var(--secondary-text-color);
            }
        `;
    }

}

customElements.define("sipjs-card-editor", ContentCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "sipjs-card",
    name: "sip.js card",
    preview: false,
    description: "A SIP card"
});