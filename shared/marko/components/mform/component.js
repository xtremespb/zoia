const axios = require("axios");
const cloneDeep = require("lodash.clonedeep");
const ExtendedValidation = require("../../../lib/extendedValidation").default;

module.exports = class {
    onCreate(input) {
        const tabs = input.tabs || [{
            id: "__default",
            label: ""
        }];
        const state = {
            tabs,
            activeTabId: tabs[0].id,
            data: {},
            errors: {}
        };
        tabs.map(tab => {
            state.data[tab.id] = {};
            state.errors[tab.id] = {};
        });
        this.fieldsFlat = input.fields.flat();
        if (input.fields) {
            tabs.map(tab => this.fieldsFlat.map(i => state.data[tab.id][i.id] = i.defaultValue || null));
        }
        this.state = state;
        if (input.validation) {
            this.extendedValidation = new ExtendedValidation(null, input.validation.root, input.validation.part, input.validation.files, input.tabs.map(t => t.id));
        }
        this.i18n = input.i18n;
    }

    onMount() {
        const autoFocusField = this.fieldsFlat.find(i => i.autoFocus);
        if (autoFocusField) {
            this.getComponent(autoFocusField.id).func.setFocus();
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
        const serialized = this.serialize(true);
        console.log(serialized);
        const validationResult = this.validate(serialized);
        this.visualizeErrors(validationResult.errorData);
        this.upload(this.serialize(false));
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

    visualizeErrors(validationErrors) {
        console.log(validationErrors);
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
        console.log(errors);
        Object.keys(errors).map(tab => {
            if (!focus && Object.keys(errors[tab]).length) {
                console.log(`tab -> ${tab}`);
                this.setState("activeTabId", tab);
                const firstField = Object.keys(errors[tab])[0];
                const firstFieldComponent = this.getComponent(firstField);
                if (firstFieldComponent) {
                    firstFieldComponent.func.setFocus();
                }
                console.log(`field -> ${firstField}`);
                focus = true;
            }
        });
        this.setState("errors", errors);
    }

    validate(serialized) {
        const data = cloneDeep(serialized);
        const validationResult = this.extendedValidation.validate(data);
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
