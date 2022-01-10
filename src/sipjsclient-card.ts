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