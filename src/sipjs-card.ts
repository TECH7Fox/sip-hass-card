// @ts-nocheck

import { Web } from "sip.js/lib/index.js";
import {
  LitElement,
  html,
  css
} from "lit-element";
import "./editor";

class SipJsCard extends LitElement {
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
    ha-card {
        cursor: pointer;
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
    #phone .content {
        color: white;
    }
    video {
        display: block;
        height: auto;
        width: 100%;
        background-color: dimgray;
    }
    .box {
        /* start paper-font-common-nowrap style */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        /* end paper-font-common-nowrap style */
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(
          --ha-picture-card-background-color,
          rgba(0, 0, 0, 0.3)
        );
        padding: 4px 8px;
        font-size: 16px;
        line-height: 40px;
        color: var(--ha-picture-card-text-color, white);
        display: flex;
        justify-content: space-between;
        flex-direction: row;
    }
    .box .title {
        font-weight: 500;
        margin-left: 8px;
    }
    .row {
        display: flex;
        flex-direction: row;
    }
    .container {
        transition: filter 0.2s linear 0s;
        width: 80vw;
    }
    ha-dialog {
        --dialog-content-padding: 0;
    }
    .box, ha-icon {
        display: flex;
        align-items: center;
    }
    .accept-btn {
        color: var(--label-badge-green);
    }
    .hangup-btn {
        color: var(--label-badge-red);
    }
    ha-dialog {
        --mdc-dialog-max-width: 80vw;
    }
    #time, .title {
        margin-right: 8px;
        display: flex;
        align-items: center;
    }
    `;
    }
    closePopup() {
        this.popup = false;
        this.requestUpdate();
    }
    openPopup() {
        // Temp solution! Otherwise won't open dialog again.
        this.popup = false;
        super.update();
        this.popup = true;
        super.update();
    }
    // @closed="${this.closePopup}
    render() {
        return html`
            <ha-dialog id="phone" ?open=${this.popup} hideactions>
                <div slot="heading" class="heading">
                    <ha-header-bar>
                        <ha-icon-button slot="navigationIcon" dialogaction="cancel"></ha-icon-button>
                        <div slot="title" class="main-title" title="Call">Call</div>
                        <ha-icon-button slot="actionItems"></ha-icon-button>
                    </ha-header-bar>
                </div>
                <div class="content">
                    <div class="container">
                        <video id="remoteVideo"></video>
                        <audio id="remoteAudio" style="display:none"></audio>
                        <audio id="toneAudio" style="display:none" loop controls></audio>
                    </div>
                    <div class="box">
                        <div class="row">
                            <ha-icon-button 
                                class="accept-btn"
                                .label=${"Accept Call"}
                                @click="${this._answer}"
                                ><ha-icon icon="hass:phone"></ha-icon>
                            </ha-icon-button>
                            <span id="name" class="title">
                                Calling...
                            </span>
                        </div>
                        <div class="row">
                            ${this.config.dtmfs ?  
                                this.config.dtmfs.map(dtmf => {
                                    return html `
                                        <ha-icon-button 
                                            @click="${() => this._sendDTMF(dtmf.signal)}"
                                            .label="${dtmf.name}"
                                            ><ha-icon icon="${dtmf.icon}"></ha-icon>
                                        </ha-icon-button>
                                    `;
                                }) : ""
                            }
                        </div>
                        <div class="row">
                            <span id="time">01:32</span>
                            <ha-icon-button 
                                class="hangup-btn"
                                .label=${"Decline Call"}
                                @click="${this._hangup}"
                            ><ha-icon icon="hass:phone-hangup"></ha-icon>
                            </ha-icon-button>
                        </div>
                    </div>
                </div>
            </ha-dialog>
            
            <ha-card @click="${this.openPopup}">
                <h1 class="card-header">
                    <span id="state" class="name">Connecting...</span>
                    <span style="display: none;">State color?</span>
                </h1>
                <div class="wrapper">
              ${this.config.entities.map(ent => {
                const stateObj = this.hass.states[ent.entity];
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
              
        </div>
        </ha-card>
        `;
    }
    firstUpdated() {
        this.popup = false;
        this.connect();
    }
    setConfig(config) {
        if (!config.server) {
            throw new Error("You need to define a server");
        }
        this.config = config;
        //this.connect;
    }
    static async getConfigElement() {
        return document.createElement("sipjs-card-editor");
    }

    static getStubConfig() {
        // Return a minimal configuration that will result in a working card configuration
        return {
            server: "localhost",
            port: "8089"
        };
    }

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
customElements.define('sipjs-card', SipJsCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "sipjs-card",
    name: "sip.js card",
    preview: false,
    description: "A SIP card."
});