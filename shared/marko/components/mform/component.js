const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");

module.exports = class {
    onCreate(input) {
        const tabs = input.tabs || [{
            id: "__default",
            label: ""
        }];
        const state = {
            tabs,
            activeTabId: tabs[0].id,
            data: {}
        };
        tabs.map(tab => state.data[tab.id] = {});
        this.fieldsFlat = input.fields.flat();
        if (input.fields) {
            tabs.map(tab => this.fieldsFlat.map(i => state.data[tab.id][i.id] = i.defaultValue || null));
        }
        this.state = state;
    }

    onMount() {
        const autoFocusField = this.fieldsFlat.find(i => i.autoFocus);
        if (autoFocusField) {
            this.getComponent(autoFocusField.id).func.setFocus(autoFocusField.id);
        }
    }

    onTabClick(e) {
        const {
            id
        } = e.target.dataset;
        this.setState("activeTabId", id);
    }

    onValueChange(obj) {
        const data = {
            ...this.state.data
        };
        let {
            value,
        } = obj;
        switch (obj.type) {
        case "file":
            const prev = data[this.state.activeTabId][obj.id] ? data[this.state.activeTabId][obj.id] : [];
            value = [...prev, ...Array.from(value)];
            break;
        default:
            value = String(value).trim();
        }
        data[this.state.activeTabId][obj.id] = value;
        if (this.fieldsFlat.find(f => f.id === obj.id).shared) {
            this.state.tabs.map(tab => data[tab.id][obj.id] = value);
        }
        this.setState("data", data);
        const serialized = this.serialize();
        this.upload(serialized);
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

    validate() {
        const data = {
            ...this.state.data
        };
        const errors = {};
        this.fieldsFlat.map(field => {
            this.state.tabs.map(tab => {
                const value = data[tab.id][field.id] !== null ? String(data[tab.id][field.id]).trim() : null;
                if (field.mandatory && (!value || !value.length)) {
                    errors[tab.id] = errors[tab.id] || {};
                    errors[tab.id][field.id] = "mandatoryFieldMissing";
                }
            });
        });
    }

    processSerializedValue(field, value) {
        let valueProcess = value;
        if (field.convert) {
            valueProcess = field.convert === "integer" ? parseInt(value, 10) : field.convert === "float" ? parseFloat(value) : String(value);
        }
        return valueProcess;
    }

    serialize() {
        const serialized = {};
        const data = cloneDeep(this.state.data);
        this.fieldsFlat.map(field => {
            if (field.shared) {
                serialized[field.id] = this.processSerializedValue(field, data[this.state.activeTabId][field.id]);
            } else {
                this.state.tabs.map(tab => {
                    serialized[tab.id] = serialized[tab.id] || {};
                    serialized[tab.id][field.id] = this.processSerializedValue(field, data[tab.id][field.id]);
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

    upload(serialized) {
        const data = {
            ...serialized
        };
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
        } else {
            uploadData = this.filterSerialized(data);
        }
        axios.post("/api/users/test", uploadData);
    }
};
