const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const ExtendedValidation = require("../../../lib/extendedValidation").default;

const serializableTypes = ["text", "select", "radio", "checkbox", "checkboxes", "file"];

module.exports = class {
    onCreate(input) {
        let tabs;
        if (input.tabsAvail && input.tabsActive) {
            tabs = input.tabsActive.map(taId => input.tabsAvail.find(t => t.id === taId));
        } else if (input.tabsAvail) {
            tabs = input.tabsAvail;
        } else {
            tabs = [{
                id: "__default",
                label: "",
                default: true
            }];
        }
        const state = {
            tabs,
            tabsSelect: [],
            tabSettingsDialogActive: false,
            activeTabId: tabs[0].id,
            data: {},
            error: null,
            errors: {},
            disabled: false,
            progress: false,
            loading: false
        };
        tabs.map(tab => {
            state.data[tab.id] = {};
            state.errors[tab.id] = {};
        });
        this.fieldsFlat = input.fields.flat();
        if (input.fields) {
            tabs.map(tab => this.fieldsFlat.map(i => state.data[tab.id][i.id] = this.getDefaultValue(i)));
        }
        this.state = state;
        if (input.validation) {
            this.extendedValidation = new ExtendedValidation(null, input.validation.root, input.validation.part, input.validation.files, tabs.map(t => t.id));
        }
        this.func = {
            loadData: this.loadData.bind(this)
        };
        this.i18n = input.i18n;
    }

    getDefaultValue(item) {
        if (item.defaultValue) {
            return item.defaultValue;
        }
        switch (item.type) {
        case "select":
            return item.options && item.options.length ? item.options[0].value : null;
        case "checkbox":
            return false;
        case "checkboxes":
            return [];
        default:
            return null;
        }
    }

    autoFocus() {
        const autoFocusField = this.fieldsFlat.find(i => i.autoFocus);
        if (autoFocusField && this.getComponent(autoFocusField.id)) {
            this.getComponent(autoFocusField.id).func.setFocus();
        }
    }

    onMount() {
        this.autoFocus();
    }

    onTabClick(e) {
        const {
            id
        } = e.target.dataset;
        this.setState("activeTabId", id);
        this.autoFocus();
    }

    onTabSettingsClick() {
        const tabsSelect = this.input.tabsAvail.map(tab => ({
            ...tab,
            selected: !!this.state.tabs.find(t => t.id === tab.id)
        }));
        this.setState("tabsSelect", tabsSelect);
        this.setState("tabSettingsDialogActive", true);
    }

    onTabsSelectChange(e) {
        const tabsSelect = cloneDeep(this.state.tabsSelect);
        const {
            id
        } = e.target.dataset;
        const {
            checked
        } = e.target;
        const tab = tabsSelect.find(t => t.id === id);
        if (tab) {
            tab.selected = checked;
        }
        this.setState("tabsSelect", tabsSelect);
    }

    onTabSettingsDialogCloseClick() {
        this.setState("tabSettingsDialogActive", false);
    }

    onTabSettingsDialogSaveClick() {
        let tabs = cloneDeep(this.state.tabs);
        const data = cloneDeep(this.state.data);
        const errors = {};
        tabs.map(t => errors[t.id] = {});
        let dataCurrent = {};
        if (this.state.activeTabId) {
            dataCurrent = cloneDeep(this.state.data[this.state.activeTabId]);
        } else {
            this.fieldsFlat.map(i => dataCurrent[i.id] = this.getDefaultValue(i));
        }
        this.state.tabsSelect.map(ts => {
            const findTab = tabs.find(t => t.id === ts.id);
            // Add missing tabs and data
            if (ts.selected && !findTab) {
                delete ts.selected;
                tabs.push(ts);
                data[ts.id] = {};
                errors[ts.id] = {};
                this.fieldsFlat.map(i => data[ts.id][i.id] = i.shared ? dataCurrent[i.id] : this.getDefaultValue(i));
            }
            // Remove existing tabs and data
            if (!ts.selected && findTab) {
                tabs = tabs.filter(t => t.id !== ts.id);
                delete data[ts.id];
                delete errors[ts.id];
            }
        });
        let activeTabId = cloneDeep(this.state.activeTabId);
        if (!tabs.find(t => t.id === activeTabId)) {
            if (Object.keys(tabs).length) {
                activeTabId = tabs[0].id;
            } else {
                activeTabId = null;
            }
        }
        if (this.input.validation) {
            this.extendedValidation.setParts(tabs.map(t => t.id));
        }
        this.setState("data", data);
        this.setState("errors", errors);
        this.setState("tabs", tabs);
        this.setState("tabSettingsDialogActive", false);
        this.setState("activeTabId", activeTabId);
        if (activeTabId) {
            this.autoFocus();
        }
    }

    onValueChange(obj) {
        const data = cloneDeep(this.state.data);
        let {
            value,
        } = obj;
        switch (obj.type) {
        case "boolean":
            value = Boolean(value);
            break;
        case "file":
            const prev = data[this.state.activeTabId][obj.id] ? data[this.state.activeTabId][obj.id] : [];
            value = [...prev, ...Array.from(value)];
            break;
        case "arr":
            let currentItemState = cloneDeep(data[this.state.activeTabId][obj.id]);
            const checked = !!value;
            if (currentItemState.indexOf(obj.inputid) === -1 && checked) {
                currentItemState.push(obj.inputid);
            }
            if (currentItemState.indexOf(obj.inputid) > -1 && !checked) {
                currentItemState = currentItemState.filter(i => i !== obj.inputid);
            }
            value = currentItemState;
            break;
        default:
            value = String(value).trim();
        }
        data[this.state.activeTabId][obj.id] = value;
        if (this.fieldsFlat.find(f => f.id === obj.id).shared) {
            this.state.tabs.map(tab => data[tab.id][obj.id] = value);
        }
        this.setState("data", data);
    }

    onRemoveArrItem(obj) {
        const data = {
            ...this.state.data
        };
        const value = data[this.state.activeTabId][obj.id].filter(i => i.id !== obj.itemid);
        data[this.state.activeTabId][obj.id] = value;
        if (this.fieldsFlat.find(f => f.id === obj.id).shared) {
            this.state.tabs.map(tab => data[tab.id][obj.id] = value);
        }
        this.setState("data", data);
    }

    visualizeErrors(validationErrors, generalError = true) {
        let errorData = cloneDeep(validationErrors);
        const errors = {};
        this.state.tabs.map(tab => errors[tab.id] = {});
        if (errorData && errorData.length) {
            // Identify field for each error
            errorData.map(error => {
                error.field = error.dataPath;
                if (!error.field && error.params && error.params.missingProperty) {
                    error.field = error.params.missingProperty;
                }
                if (error.field) {
                    error.field = error.field.replace(/^\./, "");
                } else {
                    error.field = null;
                }
            });
            // Sort errors as it appears on form
            errorData = errorData.sort((i1, i2) => {
                const f1 = this.fieldsFlat.findIndex(f => f.id === i1.field);
                const f2 = this.fieldsFlat.findIndex(f => f.id === i2.field);
                if (f1 === f2) {
                    return 0;
                }
                return f1 > f2 ? 1 : -1;
            });
            // Set keywords for errors
            errorData.map(error => {
                const {
                    field
                } = error;
                if (!field) {
                    return;
                }
                const {
                    keyword,
                    part
                } = error;
                if (part) {
                    errors[part][field] = this.i18n.t(`mFormErr.${keyword}`) || keyword;
                } else {
                    this.state.tabs.map(tab => errors[tab.id][field] = this.i18n.t(`mFormErr.${keyword}`) || keyword);
                }
            });
        }
        let focus = false;
        Object.keys(errors).map(tab => {
            if (!focus && Object.keys(errors[tab]).length) {
                this.setState("activeTabId", tab);
                const firstField = Object.keys(errors[tab])[0];
                const firstFieldComponent = this.getComponent(firstField);
                if (firstFieldComponent) {
                    setTimeout(firstFieldComponent.func.setFocus.bind(this), 0);
                }
                focus = true;
            }
        });
        if (generalError) {
            this.setState("error", focus ? this.i18n.t(`mFormErr.general`) : null);
        }
        this.setState("errors", errors);
    }

    validate(serialized) {
        const data = cloneDeep(serialized);
        if (!this.input.validation) {
            return {
                failed: false,
                errorData: []
            };
        }
        const validationResult = this.extendedValidation.validate(data);
        this.fieldsFlat.map(field => {
            if (field.shouldMatch) {
                const value1 = String(this.state.data[this.state.activeTabId][field.id]);
                const value2 = String(this.state.data[this.state.activeTabId][field.shouldMatch]);
                if ((field.mandatory && (!value1 || value1 !== value2)) || (!field.mandatory && value1 !== value2)) {
                    validationResult.failed = true;
                    validationResult.errorData.push({
                        keyword: "shouldMatch",
                        dataPath: `.${field.id}`,
                        message: `Should match ${field.shouldMatch}`
                    });
                }
            }
        });
        return validationResult;
    }

    processSerializedValue(field, value) {
        let valueProcess = value;
        if (field.convert) {
            valueProcess = field.convert === "integer" ? parseInt(value, 10) : field.convert === "float" ? parseFloat(value) : String(value);
        }
        return valueProcess;
    }

    serialize(undef) {
        const serialized = {};
        const emptyValues = undef ? undefined : "";
        const data = cloneDeep(this.state.data);
        this.fieldsFlat.map(field => {
            if (field.shared) {
                const value = this.processSerializedValue(field, data[this.state.activeTabId][field.id]);
                serialized[field.id] = value === null ? emptyValues : value;
            } else {
                this.state.tabs.map(tab => {
                    serialized[tab.id] = serialized[tab.id] || {};
                    const value = this.processSerializedValue(field, data[tab.id][field.id]);
                    serialized[tab.id][field.id] = value === null ? emptyValues : value;
                });
            }
        });
        return serialized;
    }

    flatten(object, prefix = "") {
        return Object.keys(object).reduce((prev, element) => (object[element] && typeof object[element] === "object" && !(object[element] instanceof File) && !Array.isArray(element) ? {
            ...prev,
            ...this.flatten(object[element], `${prefix}${element}.`)
        } : {
            ...prev,
            ...{
                [`${prefix}${element}`]: object[element]
            }
        }), {});
    }

    filterSerialized(serialized) {
        let data = cloneDeep(serialized);
        this.state.tabs.map(tab => {
            Object.keys(data[tab.id]).map(i => {
                if (data[tab.id][i] && Array.isArray(data[tab.id][i])) {
                    data[tab.id][i].map(f => {
                        if (typeof f === "object" && f.type === "file") {
                            delete f.data;
                            f.upload = true;
                        }
                    });
                }
                const field = this.fieldsFlat.find(f => f.id === i);
                if (field && field.type && serializableTypes.indexOf(field.type) === -1) {
                    data[tab.id][field.id] = undefined;
                }
            });
        });
        Object.keys(data).map(i => {
            if (data[i] && Array.isArray(data[i])) {
                data[i].map(f => {
                    if (typeof f === "object" && f.type === "file") {
                        delete f.data;
                        f.upload = true;
                    }
                });
            }
            const field = this.fieldsFlat.find(f => f.id === i);
            if (field && field.type && serializableTypes.indexOf(field.type) === -1) {
                data[field.id] = undefined;
            }
        });
        if (this.state.tabs[0].id === "__default") {
            data = {
                ...data,
                ...data.__default
            };
            delete data.__default;
        }
        return data;
    }

    _setProgress(state) {
        this.setState("progress", state);
        this.setState("disabled", state);
    }

    async upload(serialized) {
        if (!this.input.save) {
            return;
        }
        const data = cloneDeep(serialized);
        let uploadData;
        if (this.input.formType === "formData") {
            uploadData = new FormData();
            const serializedFlat = this.flatten(data);
            Object.keys(serializedFlat).map(i => {
                if (serializedFlat[i] && serializedFlat[i] instanceof File) {
                    uploadData.append(serializedFlat[i].zuid, serializedFlat[i]);
                }
            });
            uploadData.append("__form", JSON.stringify(this.filterSerialized(data)));
            if (this.input.save.extras) {
                Object.keys(this.input.save.extras).map(e => uploadData.append(e, this.input.save.extras[e]));
            }
        } else {
            uploadData = this.filterSerialized(data);
            if (this.input.save.extras) {
                uploadData = {
                    ...uploadData,
                    ...this.input.save.extras
                };
            }
        }
        try {
            this._setProgress(true);
            const result = await axios.post(this.input.save.url, uploadData);
            this._setProgress(false);
            this.emit("post-success", result);
        } catch (e) {
            this._setProgress(false);
            if (e.response && e.response.data && e.response.data.error) {
                const errorKeyword = e.response.data.error.errorKeyword || (e.response.data.error.errorData && e.response.data.error.errorData.length && e.response.data.error.errorData[0].keyword) ? e.response.data.error.errorData[0].keyword : null;
                if (errorKeyword) {
                    this.setState("error", this.i18n.t(`mFormErr.${errorKeyword || "general"}`));
                }
                if (e.response.data.error.errorData) {
                    this.visualizeErrors(e.response.data.error.errorData, false);
                }
            }
        }
    }

    async onFormSubmit(e) {
        e.preventDefault();
        const serialized = this.serialize(true);
        const validationResult = this.validate(serialized);
        this.visualizeErrors(validationResult.errorData);
        if (validationResult.failed) {
            return;
        }
        await this.upload(this.serialize(false));
    }

    onButtonClick(obj) {
        this.emit("button-click", obj);
    }

    deserialize(raw) {
        const data = {};
        if (this.input.tabsAvail) {
            // Deserialize all tabs
            this.input.tabsAvail.map(tab => {
                data[tab.id] = {};
                this.fieldsFlat.map(field => data[tab.id][field.id] = raw[tab.id] && raw[tab.id][field.id] ? raw[tab.id][field.id] : this.getDefaultValue(field));
            });
            // Deserialize shared fields
            this.input.tabsAvail.map(tab => {
                this.fieldsFlat.map(field => {
                    if (raw[field.id]) {
                        data[tab.id][field.id] = raw[field.id];
                    }
                });
            });
        } else {
            // There are no tabs
            data.__default = {};
            this.fieldsFlat.map(field => {
                data.__default[field.id] = raw[field.id] || this.getDefaultValue(field);
            });
        }
        return data;
    }

    async loadData() {
        if (!this.input.load) {
            return;
        }
        this.setState("loading", true);
        this.setState("disabled", true);
        try {
            const result = await axios.post(this.input.load.url, this.input.load.extras);
            this.setState("loading", false);
            this.setState("disabled", false);
            if (result && result.data && result.data.data) {
                const data = this.deserialize(result.data.data);
                this.setState("data", data);
                setTimeout(this.autoFocus.bind(this), 0);
            }
        } catch (e) {
            this.setState("loading", false);
            if (e && e.response && e.response.data && e.response.data.error && e.response.data.error.errorKeyword) {
                this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t(`mFormErr.${e.response.data.error.errorKeyword}`) || this.i18n.t(`mFormErr.server`), "is-danger");
            } else {
                this.getComponent(`${this.input.id}_mnotify`).func.show(this.i18n.t(`mFormErr.server`), "is-danger");
            }
        }
    }
};
