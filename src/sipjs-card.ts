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
    user: any;
    config: any;
    hass: any;
    timerElement: any;
    renderRoot: any;
    intervalId: number;

    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }

    static get styles() {
        return css `
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
                padding: 0px 18px 0px 8px;
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
            .visualizer-container {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                top: 0;
                display: flex;
                align-items: center;
            }
            .visualizer-bar {
                display: inline-block;
                background: white;
                margin: 0 2px;
                width: 25px;
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

    audioVisualizer() {
        const NBR_OF_BARS = 10;
        const audio = this.renderRoot.querySelector("#remoteAudio");
        var ctx = new AudioContext();
        var audioSource = ctx.createMediaStreamSource(audio);
        var analayzer = ctx.createAnalyser();
        audioSource.connect(analayzer);
        audioSource.connect(ctx.destination);

        const frequencyData = new Uint8Array(analayzer.frequencyBinCount);
        analayzer.getByteFrequencyData(frequencyData);
        console.log("frequencyData", frequencyData);

        const visualizerContainer = this.renderRoot.querySelector(".visualizer-container");

        
        // Create a set of pre-defined bars
        for( let i = 0; i < NBR_OF_BARS; i++ ) {

            const bar = document.createElement("DIV");
            bar.setAttribute("id", "bar" + i);
            bar.setAttribute("class", "visualizer-bar");
            visualizerContainer.appendChild(bar);

        }

        // This function has the task to adjust the bar heights according to the frequency data
        function renderFrame() {

            // Update our frequency data array with the latest frequency data
            analayzer.getByteFrequencyData(frequencyData);

            for( let i = 0; i < NBR_OF_BARS; i++ ) {

                // Since the frequency data array is 1024 in length, we don't want to fetch
                // the first NBR_OF_BARS of values, but try and grab frequencies over the whole spectrum
                const index = (i + 10) * 2;
                // fd is a frequency value between 0 and 255
                const fd = frequencyData[index];

                // Fetch the bar DIV element
                const bar = this.renderRoot.querySelector("#bar" + i);
                if( !bar ) {
                    continue;
                }

                // If fd is undefined, default to 0, then make sure fd is at least 4
                // This will make make a quiet frequency at least 4px high for visual effects
                const barHeight = Math.max(4, fd || 0);
                bar.style.height = barHeight + "px";

            }

            // At the next animation frame, call ourselves
            window.requestAnimationFrame(renderFrame.call(this));

        }

        renderFrame.call(this);
        
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
                    <div class="visualizer-container"></div>
                    <div class="box">
                        <div class="row">
                            <ha-icon-button 
                                class="accept-btn"
                                .label=${"Accept Call"}
                                @click="${this._answer}"
                                ><ha-icon icon="hass:phone"></ha-icon>
                            </ha-icon-button>
                            <span id="name" class="title">Idle</span>
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
                            <span id="time">00:00</span>
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

                    ${this.config.extensions.map(extension => {
                        var stateObj = this.hass.states[extension.entity];
                        var isMe = (this.hass.user.id == this.hass.states[extension.person].attributes.user_id);
                        if (isMe) { this.user = extension; }
                        return html`
                            <div class="flex">
                                <state-badge
                                    .stateObj=${stateObj}
                                    .overrideIcon=${extension.icon}
                                    .stateColor=${this.config.state_color}
                                ></state-badge>
                                <div class="info">${extension.name}</div>
                                <mwc-button @click="${() => this._call(extension.extension)}">CALL</mwc-button>
                            </div>
                        `;
                    })}

                    ${this.config.custom ?
                        this.config.custom.map(custom => {
                            var stateObj = this.hass.states[custom.entity];
                            return html`
                                <div class="flex">
                                    <state-badge
                                        .stateObj=${stateObj}
                                        .overrideIcon=${custom.icon}
                                        .stateColor=${this.config.state_color}
                                    ></state-badge>
                                    <div class="info">${custom.name}</div>
                                    <mwc-button @click="${() => this._call(custom.number)}">CALL</mwc-button>
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
            throw new Error("You need to define a server!");
        }
        this.config = config;
    }

    static async getConfigElement() {
        return document.createElement("sipjs-card-editor");
    }

    static getStubConfig() {
        // Return a minimal configuration that will result in a working card configuration
        return {
            server: "192.168.178.0.1",
            port: "8089"
        };
    }

    getCardSize() {
        return this.config.extensions.length + 1;
    }

    private ring(tone) {
        var toneAudio = this.renderRoot.querySelector('#toneAudio');
        if (this.config[tone]) {
            toneAudio.src = this.config[tone];
            toneAudio.currentTime = 0;
            toneAudio.play();
        } else {
            toneAudio.pause();
        }
    }

    private setName(text) {
        this.renderRoot.querySelector('#name').innerHTML = text;
    }

    private setState(text) {
        this.renderRoot.querySelector('#state').innerHTML = text;
    }

    async _call(extension) {
        this.ring("ringbacktone");
        this.setName("Calling...");
        await this.simpleUser.call("sip:" + extension + "@" + this.config.server);
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

        console.log(this.hass);

        var options: Web.SimpleUserOptions = {
            aor: "sip:" + this.user.extension + "@" + this.config.server,
            media: {
                remote: {
                    audio: this.renderRoot.querySelector("#remoteAudio"),
                }
            },
            userAgentOptions: {
                authorizationUsername: this.user.extension,
                authorizationPassword: this.user.secret,
            }
        };

        if (this.config.video) {
            options.media.remote.video = this.renderRoot.querySelector('#remoteVideo');
        }
        
        this.simpleUser = new Web.SimpleUser("wss://" + this.config.server + ":" + this.config.port + "/ws", options);
        
        await this.simpleUser.connect();
        this.setState("Connected");

        await this.simpleUser.register();
        this.setState("Registered as " + this.user.name + ' <span style="color: gray">' + this.user.extension + "</span>");

        this.simpleUser.delegate = {
            onCallReceived: async () => {
                if (this.config.autoAnswer) {
                    await this.simpleUser.answer();
                    return;
                }

                this.ring("ringtone");

                if (this.simpleUser.session._assertedIdentity) {
                    this.setName("Incoming Call From " + this.simpleUser.session._assertedIdentity._displayName);
                } else {
                    this.setName("Incoming Call"); 
                }

            },
            onCallAnswered: () => {
                
                this.audioVisualizer();

                this.ring("pause");
                console.log(this.simpleUser.session);
                if (this.simpleUser.session._assertedIdentity) {
                    this.setName(this.simpleUser.session._assertedIdentity._displayName);
                } else {
                    this.setName("On Call");
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
                this.ring("pause");
                this.setName("Idle");
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