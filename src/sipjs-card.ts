import { UA, WebSocketInterface } from "jssip/lib/JsSIP";
import { RTCSessionEvent } from "jssip/lib/UA";
import { EndEvent, PeerConnectionEvent, IncomingEvent, OutgoingEvent, RTCSession } from "jssip/lib/RTCSession";

import {
  LitElement,
  html,
  css,
  unsafeCSS
} from "lit";
import "./editor";
import { customElement } from "lit/decorators.js";
import "./audioVisualizer";
import { AudioVisualizer } from "./audioVisualizer";

@customElement('sipjs-card')
class SipJsCard extends LitElement {
    sipPhone: UA | undefined;
    sipPhoneSession: RTCSession | null;
    sipCallOptions: any;
    user: any;
    config: any;
    hass: any;
    timerElement: any;
    renderRoot: any;
    popup: boolean = false;
    currentCamera: any;
    intervalId!: number;
    error: any = null;
    audioVisualizer: any;

    constructor() {
        super();
        this.sipPhoneSession = null;
    }

    static get properties() {
        return {
            hass: {},
            config: {},
            popup: {
                type: Boolean
            },
            timerElement: {},
            currentCamera: {}
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
                height: 80vh;
                width: 100%;
                background-color: #2b2b2b;
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
                min-height: 5px;
            }
            .box {
                position: absolute;
                /* start paper-font-common-nowrap style */
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                /* end paper-font-common-nowrap style */
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
            #time, .title {
                margin-right: 8px;
                display: flex;
                align-items: center;
            }
            .extension {
                color: gray;
            }
            ha-camera-stream {
                height: auto;
                width: 100%;
                display: block;
            }

            .card-header {
                display: flex;
                justify-content: space-between;
            }

            .mdc-dialog__surface {
                position: relative;
                display: flex;
                flex-direction: column;
                flex-grow: 0;
                flex-shrink: 0;
                box-sizing: border-box;
                max-width: 100%;
                max-height: 100%;
                pointer-events: auto;
                overflow-y: auto;
            }

            .mdc-dialog__container {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-around;
                box-sizing: border-box;
                height: 100%;
                transform: scale(0.8);
                opacity: 0;
                pointer-events: none;
            }

            ha-dialog[data-domain="camera"] {
                --dialog-content-padding: 0;
            }

            ha-dialog[data-domain="camera"] .content, ha-dialog[data-domain="camera"] ha-header-bar {
                width: auto;
            }

            ha-dialog {
                --dialog-surface-position: static;
                --mdc-dialog-max-width: 90vw !important;
                --mdc-dialog-min-width: 400px;
                --mdc-dialog-heading-ink-color: var(--primary-text-color);
                --mdc-dialog-content-ink-color: var(--primary-text-color);
                --justify-action-buttons: space-between;
            }

            #audioVisualizer {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
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
        `;
    }

    closePopup() {
        this.popup = false;
    }

    openPopup() {
        this.popup = false;
        super.performUpdate();
        this.popup = true;
    }

    // allow-exoplayer

    render() {
        return html`
            <style>
                ha-icon-button {
                    --mdc-icon-button-size: ${this.config.button_size ? unsafeCSS(this.config.button_size) : css`48`}px;
                    --mdc-icon-size: ${this.config.button_size ? unsafeCSS(this.config.button_size - 25) : css`23`}px;
                }
            </style>
            <ha-dialog id="phone" ?open=${this.popup} hideactions data-domain="camera">
                <div slot="heading" class="heading">
                    <ha-header-bar>
                        <ha-icon-button slot="navigationIcon" dialogaction="cancel"></ha-icon-button>
                        <div slot="title" class="main-title" title="Call">Call</div>
                        <ha-icon-button slot="actionItems"></ha-icon-button>
                    </ha-header-bar>
                </div>
                <div class="content">
                    ${this.currentCamera !== undefined ? html`
                        <ha-camera-stream
                            allow-exoplayer
                            muted
                            .hass=${this.hass}
                            .stateObj=${this.hass.states[this.currentCamera]}
                        ></ha-camera-stream>
                    ` : html`
                        <div id="audioVisualizer"></div>
                        <video id="remoteVideo"></video>
                    `}
                    <audio id="remoteAudio" style="display:none"></audio>
                    <audio id="toneAudio" style="display:none" loop controls></audio>
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
                            <ha-icon-button
                                .label=${"Mute"}
                                @click="${this._toggleMute}"
                                ><ha-icon id="mute-icon" icon="hass:microphone"></ha-icon>
                            </ha-icon-button>
                        </div>
                        <div class="row">
                            ${this.config.dtmfs ?  
                                this.config.dtmfs.map((dtmf: { signal: any; name: any; icon: any; }) => {
                                    return html `
                                        <ha-icon-button 
                                            @click="${() => this._sendDTMF(dtmf.signal)}"
                                            .label="${dtmf.name}"
                                            ><ha-icon icon="${dtmf.icon}"></ha-icon>
                                        </ha-icon-button>
                                    `;
                                }) : ""
                            }
                            ${this.config.buttons ?  
                                this.config.buttons.map((button: { entity: any; name: any; icon: any; }) => {
                                    return html `
                                        <ha-icon-button 
                                            @click="${() => this._button(button.entity)}"
                                            .label="${button.name}"
                                            ><ha-icon icon="${button.icon}"></ha-icon>
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
                    <span id="title" class="name">Unknown</span>
                    <span id="extension" class="extension">None</span>
                </h1>
                <div class="wrapper">

                    ${(this.error !== null) ? html`
                        <ha-alert alert-type="error" .title=${this.error.title}>
                            ${this.error.message}
                        </ha-alert>
                        ` : ''
                    }

                    ${this.config.extensions.map((extension: { entity: string | number; person: string | number; icon: any; name: any; extension: any; camera: any; }) => {
                        var stateObj = this.hass.states[extension.entity];
                        var isMe = (this.hass.user.id == this.hass.states[extension.person].attributes.user_id);
                        if (isMe) {
                            this.user = extension;
                        }
                        if (!(isMe && this.config.hide_me)) {
                            return html`
                                <div class="flex">
                                    <state-badge
                                        .stateObj=${stateObj}
                                        .overrideIcon=${extension.icon}
                                        .stateColor=${this.config.state_color}
                                    ></state-badge>
                                    <div class="info">${extension.name}</div>
                                    <mwc-button @click="${() => this._call(extension.extension, extension.camera)}">CALL</mwc-button>
                                </div>
                            `;
                        }
                    })}

                    ${this.config.custom ?
                        this.config.custom.map((custom: { entity: string | number; icon: any; name: any; number: any; camera: any; }) => {
                            var stateObj = this.hass.states[custom.entity];
                            return html`
                                <div class="flex">
                                    <state-badge
                                        .stateObj=${stateObj}
                                        .overrideIcon=${custom.icon}
                                        .stateColor=${this.config.state_color}
                                    ></state-badge>
                                    <div class="info">${custom.name}</div>
                                    <mwc-button @click="${() => this._call(custom.number, custom.camera)}">CALL</mwc-button>
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
        this.currentCamera = undefined;
        this.connect();
    }

    setConfig(config: { server: any; port: any; extensions: any; }): void {
        if (!config.server) {
            throw new Error("You need to define a server!");
        }
        if (!config.port) {
            throw new Error("You need to define a port!");
        }
        if (!config.extensions) {
            throw new Error("You need to define at least one extension!");
        }
        this.config = config;
    }

    static async getConfigElement() {
        return document.createElement("sipjs-card-editor");
    }

    static getStubConfig() {
        return {
            server: "192.168.178.0.1",
            port: "8089",
            button_size: "48",
            custom: [
                {
                    name: 'Custom1',
                    number: '123',
                    icon: 'mdi:phone-classic'
                }
            ],
            dtmfs: [
                {
                    name: 'dtmf1',
                    signal: 1,
                    icon: 'mdi:door'
                }
            ]
        };
    }

    getCardSize() {
        return this.config.extensions.length + 1;
    }

    private ring(tone: string) {
        var toneAudio = this.renderRoot.querySelector('#toneAudio');
        if (this.config[tone]) {
            toneAudio.src = this.config[tone];
            toneAudio.currentTime = 0;
            toneAudio.play();
        } else {
            toneAudio.pause();
        }
    }

    private setName(text: string) {
        this.renderRoot.querySelector('#name').innerHTML = text;
    }

    private setTitle(text: any) {
        this.renderRoot.querySelector('#title').innerHTML = text;
    }

    private setExtension(text: any) {
        this.renderRoot.querySelector('#extension').innerHTML = text;
    }

    async _call(extension: string | null, camera: any) {
        this.ring("ringbacktone");
        this.setName("Calling...");
        this.currentCamera = (camera ? camera : undefined);
        if (this.sipPhone) {
            this.sipPhone.call("sip:" + extension + "@" + this.config.server, this.sipCallOptions);
        }
    }

    async _answer() {
        this.sipPhoneSession?.answer();
    }

    async _hangup() {
        this.sipPhoneSession?.terminate();
    }

    async _toggleMute() {
        if (this.sipPhoneSession?.isMuted) {
            this.sipPhoneSession?.unmute();
            this.renderRoot.querySelector('#mute-icon').icon = "hass:microphone";
        }
        else {
            this.sipPhoneSession?.mute();
            this.renderRoot.querySelector('#mute-icon').icon = "hass:microphone-off";
        }
    }

    async _sendDTMF(signal: any) {
        this.sipPhoneSession?.sendDTMF(signal);
    }

    async _button(entity: string) {
        const domain = entity.split(".")[0];
        let service;
        console.log(domain);
        
        switch(domain) {
            case "script":
                service = "turn_on";
                break;
            case "button":
                service = "press";
                break;
            case "scene":
                service = "turn_on";
                break;
            case "light":
                service = "toggle";
                break;
            case "switch":
                service = "toggle";
                break;
            case "input_boolean":
                service = "toggle";
                break;
            default:
                console.log("No supported service");
                return;
        }
        console.log(service);

        await this.hass.callService(domain, service, {
            entity_id: entity
        });
    }
    
    async connect() {

        const visualMainElement: any = this.renderRoot.querySelector('#audioVisualizer');
        const visualValueCount = 16;
        let visualElements: any;
        const createDOMElements = () => {
            let i;
            for ( i = 0; i < visualValueCount; ++i ) {
                const elm = document.createElement( 'div' );
                visualMainElement!.appendChild( elm );
            }     

            visualElements = this.renderRoot.querySelectorAll('#audioVisualizer div');
        };

        const init = () => {
            const audioContext = new AudioContext();
            const initDOM = () => {
                visualMainElement!.innerHTML = '';
                createDOMElements();
            };
            initDOM();
        
            // Swapping values around for a better visual effect
            const dataMap: any = { 0: 15, 1: 10, 2: 8, 3: 9, 4: 6, 5: 5, 6: 2, 7: 1, 8: 0, 9: 4, 10: 3, 11: 7, 12: 11, 13: 12, 14: 13, 15: 14 };
            const processFrame = ( data: any ) => {
                const values: any = Object.values( data );
                let i;
                for ( i = 0; i < visualValueCount; ++i ) {
                    const value = (values[ dataMap[ i ] ] / 255);// + 0.025;
                    const elmStyles = visualElements[ i ].style;
                    elmStyles.transform = `scaleY( ${ value } )`;
                    elmStyles.opacity = Math.max( .25, value );
                }   
            };

            let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
            this.audioVisualizer = new AudioVisualizer( audioContext, processFrame, remoteAudio.srcObject );
        };

        this.timerElement = this.renderRoot.querySelector('#time');
        if (this.user == undefined) {
            this.error = {
                title: "Person not configured!",
                message: "There is no extension configured for this person."
            }
            this.requestUpdate();
            throw new Error("Person not configured!");
        }
        this.setTitle((this.config.custom_title !== "") ? this.config.custom_title : this.user.name);

        var socket = new WebSocketInterface("wss://" + this.config.server + ":" + this.config.port + "/ws");
        var configuration = {
            sockets : [ socket ],
            uri     : "sip:" + this.user.extension + "@" + this.config.server,
            authorization_user: this.user.extension,
            password: this.user.secret,
            register: true
        };

        this.sipPhone = new UA(configuration);

        this.setExtension(this.user.extension);

        this.sipCallOptions = { 
            'mediaConstraints': { 'audio': true, 'video': this.config.video } 
        };

        this.sipPhone?.start();

        this.sipPhone?.on("registered", () => console.log('SIPPhone Registered with SIP Server'));
        this.sipPhone?.on("unregistered", () => console.log('SIPPhone Unregistered with SIP Server'));
        this.sipPhone?.on("registrationFailed", () => console.log('SIPPhone Failed Registeration with SIP Server'));
        this.sipPhone?.on("newRTCSession", (event: RTCSessionEvent) => {
            if (this.sipPhoneSession !== null ) {
                event.session.terminate();
                return;
            }

            console.log('newRTCSession!');

            this.sipPhoneSession = event.session;

            this.sipPhoneSession.on("confirmed", () => console.log('Incoming - call confirmed'));

            this.sipPhoneSession.on("failed", () =>{
                console.log('Incoming - call failed');
                if (!this.config.video && this.currentCamera == undefined) {
                    this.audioVisualizer.stop();
                }
                visualMainElement!.innerHTML = '';
                this.ring("pause");
                this.setName("Idle");
                clearInterval(this.intervalId);
                this.timerElement.innerHTML = "00:00";
                this.currentCamera = undefined;
                this.closePopup();
                this.sipPhoneSession = null;
            });

            this.sipPhoneSession.on("ended", (event: EndEvent) => {
                if (!this.config.video && this.currentCamera == undefined) {
                    this.audioVisualizer.stop();
                }
                visualMainElement!.innerHTML = '';
                this.ring("pause");
                this.setName("Idle");
                clearInterval(this.intervalId);
                this.timerElement.innerHTML = "00:00";
                this.currentCamera = undefined;
                this.closePopup();
                this.sipPhoneSession = null;
            });

            this.sipPhoneSession.on("accepted", (event: IncomingEvent | OutgoingEvent) => {
                if (!this.config.video && this.currentCamera == undefined) {
                    init();
                }
                this.ring("pause");
                if (this.sipPhoneSession?.remote_identity) {
                    this.setName(this.sipPhoneSession?.remote_identity.display_name);
                } else {
                    this.setName("On Call");
                }
                var time = new Date();
                this.intervalId = window.setInterval(function(this: any): void {
                    var delta = Math.abs(new Date().getTime() - time.getTime()) / 1000;
                    var minutes = Math.floor(delta / 60) % 60;
                    delta -= minutes * 60;
                    var seconds = delta % 60;
                    this.timerElement.innerHTML = (minutes + ":" + Math.round(seconds)).split(':').map(e => `0${e}`.slice(-2)).join(':');
                }.bind(this), 1000);
            });
            
             //Note: peerconnection seems to never fire for outgoing calls
            this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
                console.log('peerconnection!');
            });

            this.sipPhoneSession?.connection.addEventListener("track", (event: RTCTrackEvent): void => {
                console.log('Track Event!')
                let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.play();
                if (this.config.video) {
                    let remoteVideo = this.renderRoot.querySelector('#remoteVideo');
                    remoteVideo.srcObject = event.streams[0];
                    remoteVideo.play();
                }
            });

            // Typescript types for enums seem to be broken for JsSIP.
            // See: https://github.com/versatica/JsSIP/issues/750
            if (this.sipPhoneSession.direction === 'incoming') {
                var extension = this.sipPhoneSession.remote_identity.uri.user;
                this.config.extensions.forEach((element: { extension: any; camera: boolean; }) => {
                    if (element.extension == extension) {
                        this.currentCamera = (element.camera ? element.camera : undefined);
                    }
                });
                this.config.custom.forEach((element: { number: any; camera: boolean; }) => {
                    if (element.number == extension) {
                        this.currentCamera = (element.camera ? element.camera : undefined);
                    }
                });
                this.openPopup();
                if (this.config.auto_answer) {
                    this.sipPhoneSession.answer(this.sipCallOptions);
                    return;
                }

                this.ring("ringtone");

                if (this.sipPhoneSession.remote_identity) {
                    this.setName("Incoming Call From " + this.sipPhoneSession.remote_identity.display_name);
                } else {
                    this.setName("Incoming Call"); 
                }
            }
            else if (this.sipPhoneSession.direction === 'outgoing') {
            }
            else {
            }
        });

        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('call')) {
            this._call(urlParams.get('call'), undefined); // TODO: Add camera here or in the _call function itself.
            this.openPopup();
        }
    }
}
 
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "sipjs-card",
    name: "SIP Card",
    preview: false,
    description: "A SIP card, made by Jordy Kuhne."
});
