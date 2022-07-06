import {
    LitElement,
    html,
    css,
} from "lit";
import { customElement } from 'lit/decorators.js';

@customElement('sipjs-card-editor')
class SipJsCardEditor extends LitElement {
    _config: any;
    hass: any;
    _rowEditor: any;

    setConfig(config: any): void {
        this._config = config;
    }

    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }

    configChanged(newConfig: any) {   
        const event = new Event("config-changed", {
            bubbles: true,
            composed: true
        });
        (event as any).detail = {config: newConfig};
        this.dispatchEvent(event);
    }

    render() {
        if (!this._config || !this.hass) {
            return;
        }

        if (this._rowEditor) {
            var ent = this._config[this._rowEditor.key][this._rowEditor.index];
            var rowEditor;
            switch (this._rowEditor.key) {
                case "extensions":
                    rowEditor = html`
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Person"}"
                            .index=${this._rowEditor.index}
                            .value="${ent.person!}"
                            .configValue=${"person"}
                            .configKey="${"extensions"}"
                            .includeDomains="${"person"}"
                            @value-changed="${this._editArray}"
                            allow-custom-entity
                        ></ha-entity-picker>
                        <paper-input
                            .label=${"Name"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.name!}"
                            .configValue="${"name"}"
                            .configKey="${"extensions"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <paper-input
                            .label=${"Extension"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.extension!}"
                            .configValue="${"extension"}"
                            .configKey="${"extensions"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <paper-input
                            .label=${"Secret"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.secret!}"
                            .configValue="${"secret"}"
                            .configKey="${"extensions"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Status Entity"}"
                            .index=${this._rowEditor.index}
                            .value="${ent.entity!}"
                            .configValue=${"entity"}
                            .configKey="${"extensions"}"
                            @value-changed="${this._editArray}"
                            allow-custom-entity
                        ></ha-entity-picker>
                        <ha-icon-picker
                            .label=${"Icon"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.icon!}"
                            .configValue=${"icon"}
                            .configKey="${"extensions"}"
                            @value-changed="${this._editArray}"
                        ></ha-icon-picker>
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Camera"}"
                            .index="${this._rowEditor.index}"
                            .value="${ent.camera!}"
                            .includeDomains="${"camera"}"
                            .configValue="${"camera"}"
                            .configKey="${"extensions"}"
                            @value-changed=${this._editArray}
                            allow-custom-entity
                        ></ha-entity-picker>
                    `;
                    break;
                case "custom":
                    rowEditor = html`
                        <ha-formfield
                            .label=${"Edit"}
                            ><ha-switch
                                .checked=${ent.edit!}
                                .index="${this._rowEditor.index}"
                                @change=${this._editValueChanged}
                            ></ha-switch>
                        </ha-formfield>
                        <paper-input
                            .label=${"Name"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.name!}"
                            .configValue="${"name"}"
                            .configKey="${"custom"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <paper-input
                            auto-validate pattern="[0-9]*"
                            error-message="Numbers Only!"
                            .label=${"Number"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.number!}"
                            .configValue="${"number"}"
                            .configKey="${"custom"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Status Entity"}"
                            .index=${this._rowEditor.index}
                            .value="${ent.entity!}"
                            .configValue=${"entity"}
                            .configKey="${"custom"}"
                            @value-changed="${this._editArray}"
                            allow-custom-entity
                        ></ha-entity-picker>
                        <ha-icon-picker
                            .label=${"Icon"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.icon!}"
                            .configValue=${"icon"}
                            .configKey="${"custom"}"
                            @value-changed="${this._editArray}"
                        ></ha-icon-picker>
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Camera"}"
                            .index="${this._rowEditor.index}"
                            .value="${ent.camera!}"
                            .includeDomains="${"camera"}"
                            .configValue="${"camera"}"
                            .configKey="${"custom"}"
                            @value-changed=${this._editArray}
                            allow-custom-entity
                        ></ha-entity-picker>
                    `;
                    break;
                case "dtmfs":
                    rowEditor = html`
                        <paper-input
                            .label=${"Name"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.name!}"
                            .configValue="${"name"}"
                            .configKey="${"dtmfs"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <paper-input
                            auto-validate pattern="[0-9#*]*"
                            error-message="numbers, # or * only!"
                            maxlength="1"
                            .label=${"Signal"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.signal!}"
                            .configValue="${"signal"}"
                            .configKey="${"dtmfs"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <ha-icon-picker
                            .label=${"Icon"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.icon!}"
                            .configValue=${"icon"}
                            .configKey="${"dtmfs"}"
                            @value-changed="${this._editArray}"
                        ></ha-icon-picker>
                    `;
                    break;
                case "buttons":
                    rowEditor = html`
                        <paper-input
                            .label=${"Name"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.name!}"
                            .configValue="${"name"}"
                            .configKey="${"buttons"}"
                            @value-changed="${this._editArray}"
                        ></paper-input>
                        <ha-entity-picker
                            .hass="${this.hass}"
                            .label="${"Entity"}"
                            .index=${this._rowEditor.index}
                            .value="${ent.entity!}"
                            .configValue=${"entity"}
                            .configKey="${"buttons"}"
                            @value-changed="${this._editArray}"
                            allow-custom-entity
                        ></ha-entity-picker>
                        <ha-icon-picker
                            .label=${"Icon"}
                            .index="${this._rowEditor.index}"
                            .value="${ent.icon!}"
                            .configValue=${"icon"}
                            .configKey="${"buttons"}"
                            @value-changed="${this._editArray}"
                        ></ha-icon-picker>
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
                <paper-input
                    label="prefix"
                    .value="${this._config.prefix}"
                    .configValue="${"prefix"}"
                    @value-changed="${this._valueChanged}"
                ></paper-input>                
                <paper-input
                    label="Custom title"
                    .value="${this._config.custom_title}"
                    .configValue="${"custom_title"}"
                    @value-changed="${this._valueChanged}"
                ></paper-input>
                <div class="side-by-side">
                    <ha-formfield
                        .label=${"Auto Answer"}
                        ><ha-switch
                            .checked=${this._config.auto_answer}
                            .configValue=${"auto_answer"}
                            @change=${this._valueChanged}
                        ></ha-switch>
                    </ha-formfield>
                    <ha-formfield
                        .label=${"Video"}
                        ><ha-switch
                            .checked=${this._config.video}
                            .configValue=${"video"}
                            @change=${this._valueChanged}
                        ></ha-switch>
                    </ha-formfield>
                    <ha-formfield
                        .label=${"Color icons based on state?"}
                        ><ha-switch
                            .checked=${this._config.state_color}
                            .configValue=${"state_color"}
                            @change=${this._valueChanged}
                        ></ha-switch>
                    </ha-formfield>
                    <ha-formfield
                        .label=${"Hide Me"}
                        ><ha-switch
                            .checked=${this._config.hide_me}
                            .configValue=${"hide_me"}
                            @change=${this._valueChanged}
                        ></ha-switch>
                    </ha-formfield>
                </div>
                <paper-input
                    .label=${"Ringtone"}
                    .value="${this._config.ringtone}"
                    .configValue="${"ringtone"}"
                    @value-changed="${this._valueChanged}"
                ></paper-input>
                <paper-input
                    .label=${"Ringback Tone"}
                    .value="${this._config.ringbacktone}"
                    .configValue="${"ringbacktone"}"
                    @value-changed="${this._valueChanged}"
                ></paper-input>
                <paper-input
                    auto-validate pattern="[0-9]*"
                    error-message="Numbers Only!"
                    .label=${"Button Size"}
                    .value="${this._config.button_size}"
                    .configValue="${"button_size"}"
                    @value-changed="${this._valueChanged}"
                ></paper-input>
                <div class="entities">
                    <h3>Extensions (required)</h3>
                    ${this._config.extensions ? this._config.extensions.map((ent: { person: any; }, index: any) => {
                        return html`
                            <div class="entity">
                                <ha-entity-picker
                                    .hass="${this.hass}"
                                    .label="${"Person"}"
                                    .index=${index}
                                    .value="${ent.person}"
                                    .configValue=${"person"}
                                    .includeDomains="${"person"}"
                                    .configKey="${"extensions"}"
                                    @value-changed="${this._editArray}"
                                    allow-custom-entity
                                ></ha-entity-picker>
                                <ha-icon-button 
                                    class="remove-icon"
                                    .label=${"Remove Extension"}
                                    .configKey="${"extensions"}"
                                    @click="${this._removeRow}"
                                    .index="${index}"
                                    ><ha-icon icon="hass:close"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button 
                                    class="edit-icon"
                                    .label=${"Edit Extension"}
                                    .configKey="${"extensions"}"
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
                        .configKey="${"extensions"}"
                        @value-changed=${this._addRow}
                        allow-custom-entity
                    ></ha-entity-picker>
                </div>
                <div class="entities">
                    <h3>Custom</h3>
                    ${this._config.custom ? this._config.custom.map((ent: { name: any; }, index: any) => {
                        return html`
                            <div class="entity">
                                <paper-input
                                    .hass="${this.hass}"
                                    .label="${"Name"}"
                                    .index=${index}
                                    .value="${ent.name}"
                                    .configValue=${"name"}
                                    .configKey="${"custom"}"
                                    @value-changed="${this._editArray}"
                                ></paper-input>
                                <ha-icon-button 
                                    class="remove-icon"
                                    .label=${"Remove Custom Number"}
                                    .configKey="${"custom"}"
                                    @click="${this._removeRow}"
                                    .index="${index}"
                                    ><ha-icon icon="hass:close"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button 
                                    class="edit-icon"
                                    .label=${"Edit Custom Number"}
                                    .configKey="${"custom"}"
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
                        .configKey="${"custom"}"
                        @focusout=${this._addRow}
                    ></paper-input>
                </div>
                <div class="entities">
                    <h3>DTMF's</h3>
                    ${this._config.dtmfs ? this._config.dtmfs.map((ent: { name: any; }, index: any) => {
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
                <div class="entities">
                    <h3>Buttons</h3>
                    ${this._config.buttons ? this._config.buttons.map((ent: { name: any; }, index: any) => {
                        return html`
                            <div class="entity">
                                <paper-input
                                    .hass="${this.hass}"
                                    .label="${"Name"}"
                                    .index=${index}
                                    .value="${ent.name}"
                                    .configValue=${"name"}
                                    .configKey="${"buttons"}"
                                    @value-changed="${this._editArray}"
                                ></paper-input>
                                <ha-icon-button 
                                    class="remove-icon"
                                    .label=${"Remove Button"}
                                    .configKey="${"buttons"}"
                                    @click="${this._removeRow}"
                                    .index="${index}"
                                    ><ha-icon icon="hass:close"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button 
                                    class="edit-icon"
                                    .label=${"Edit Button"}
                                    .configKey="${"buttons"}"
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
                        .configKey="${"buttons"}"
                        @focusout=${this._addRow}
                    ></paper-input>
                </div>
            </div>
        `;
    }

    private _valueChanged(ev: { target: any; }): void {
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

    private _editValueChanged(ev: { target: any; }): void {
        if (!this._config || !this.hass) {
            return;
        }
        
        const target = ev.target;
        const index = (ev.target as any).index;

        var array = Object.assign([], this._config["custom"]);
        array[index] = {
            ...array[index],
            ["edit"]: target.checked
        };
        this._config = {
            ...this._config,
            ["custom"]: array
        };

        this.configChanged(this._config);
    }

    private _goBack(): void {
        this._rowEditor = undefined;
        this.requestUpdate();
    }

    private _addRow(ev: { target: { value: string | null; configKey: any; configValue: any; }; }): void {
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

    private _removeRow(ev: { currentTarget: any; }): void {
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

    private _editRow(ev: { currentTarget: any; }): void {
        var key = (ev.currentTarget as any).configKey;
        const index = (ev.currentTarget as any).index;
        this._rowEditor = {
            key: key,
            index: index
        }
        this.requestUpdate();
    }

    private _editArray(ev: { target: { configKey: any; index: any; configValue: any; value: any; }; }): void {
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
