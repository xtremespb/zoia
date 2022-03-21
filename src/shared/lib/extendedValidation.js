import Ajv from "ajv";
import cloneDeep from "lodash/cloneDeep";
import parse from "date-fns/parse";

export default class {
    constructor(data, root = {}, part = {}, files = {}, parts = []) {
        this.data = data;
        this.ajv = new Ajv();
        this.schemas = {
            root: parts.length === 1 && parts[0] === "__default" ? null : root,
            part: parts.length === 1 && parts[0] === "__default" ? root : part,
            files
        };
        this.parts = parts;
    }

    async _validateFiles(data, part = null) {
        // There is no body
        // We will validate serialized data
        if (!this.data) {
            const errors = [];
            Object.keys(this.schemas.files).map(f => {
                // If it's shared and there is no "part" defined, don't check
                // minAmount because it's already validated
                if ((this.schemas.root && !this.schemas.root.properties[f] && !part) || (this.schemas.root && this.schemas.root.properties[f] && part)) {
                    return;
                }
                if (this.schemas.files[f].minAmount && this.schemas.files[f].minAmount > 0 && (!data[f] || !data[f].length)) {
                    errors.push({
                        keyword: "minAmount",
                        dataPath: `.${f}`,
                        part,
                        message: `Amount of files is less than ${this.schemas.files[f].minAmount}`
                    });
                }
            });
            Object.keys(data).map(i => {
                const item = data[i];
                const schema = this.schemas.files[i];
                if (item && typeof item === "object" && Array.isArray(item)) {
                    if (item.length && typeof item === "object" && item[0].type === "file") {
                        if (schema.minAmount && item.length < schema.minAmount) {
                            errors.push({
                                keyword: "minAmount",
                                dataPath: `.${i}`,
                                part,
                                message: `Amount of files is less than ${schema.minAmount}`
                            });
                            return;
                        }
                        if (schema.maxAmount && item.length > schema.maxAmount) {
                            errors.push({
                                keyword: "maxAmount",
                                dataPath: `.${i}`,
                                part,
                                message: `Amount of files is more than ${schema.maxAmount}`
                            });
                            return;
                        }
                        item.map(ai => {
                            if (ai && ai.data && ai.data instanceof File) {
                                const file = ai.data;
                                if (schema.allowedMimeTypes && Array.isArray(schema.allowedMimeTypes) && schema.allowedMimeTypes.indexOf(file.type) === -1) {
                                    errors.push({
                                        keyword: "allowedMimeTypes",
                                        dataPath: `.${i}`,
                                        part,
                                        message: `Invalid MIME type: ${file.type} (${file.name})`
                                    });
                                    return;
                                }
                                if (schema.minSizeBytes && file.size < schema.minSizeBytes) {
                                    errors.push({
                                        keyword: "minSizeBytes",
                                        dataPath: `.${i}`,
                                        part,
                                        message: `File size ${file.size} is less than ${schema.minSizeBytes} (${file.name})`
                                    });
                                    return;
                                }
                                if (schema.maxSizeBytes && file.size > schema.maxSizeBytes) {
                                    errors.push({
                                        keyword: "maxSizeBytes",
                                        dataPath: `.${i}`,
                                        part,
                                        message: `File size ${file.size} is more than ${schema.maxSizeBytes} (${file.name})`
                                    });
                                }
                            }
                        });
                    }
                }
            });
            return errors;
        }
        // Need to validate body
        const gotFiles = {};
        Object.keys(data).map(i => {
            const item = data[i];
            if (item && typeof item === "object" && Array.isArray(item)) {
                (item || []).map(ai => {
                    if (ai && typeof ai === "object" && ai.type === "file" && ai.upload) {
                        gotFiles[i] = gotFiles[i] || [];
                        gotFiles[i].push(ai.id);
                    }
                });
            }
        });
        const errors = [];
        Object.keys(this.schemas.files).map(i => {
            const schema = this.schemas.files[i];
            const files = gotFiles[i] || [];
            if (schema.minAmount && files.length < schema.minAmount && ((part && !this.schemas.root.properties[i]) || (!part && this.schemas.root.properties[i]))) {
                errors.push({
                    keyword: "minAmount",
                    dataPath: `.${i}`,
                    part,
                    message: `Amount of files is less than ${schema.minAmount}`
                });
            }
            if (schema.maxAmount && files.length > schema.maxAmount) {
                errors.push({
                    keyword: "maxAmount",
                    dataPath: `.${i}`,
                    part,
                    message: `Amount of files is more than ${schema.maxAmount}`
                });
            }
            files.map(async f => {
                const file = this.data.files[f];
                if (!file) {
                    errors.push({
                        keyword: "missing",
                        dataPath: `.${i}`,
                        part,
                        message: `File is missing: ${f}`
                    });
                    return;
                }
                if (schema.allowedMimeTypes && Array.isArray(schema.allowedMimeTypes) && schema.allowedMimeTypes.indexOf(file.mimeType) === -1) {
                    errors.push({
                        keyword: "allowedMimeTypes",
                        dataPath: `.${i}`,
                        part,
                        message: `Invalid MIME type: ${file.mimetype} (${f})`
                    });
                    return;
                }
                if (schema.minSizeBytes && file.length < schema.minSizeBytes) {
                    errors.push({
                        keyword: "minSizeBytes",
                        dataPath: `.${i}`,
                        part,
                        message: `File size ${file.length} is less than ${schema.minSizeBytes} (${f})`
                    });
                    return;
                }
                if (schema.maxSizeBytes && file.length > schema.maxSizeBytes) {
                    errors.push({
                        keyword: "maxSizeBytes",
                        dataPath: `.${i}`,
                        part,
                        message: `File size ${file.length} is more than ${schema.maxSizeBytes} (${f})`
                    });
                }
            });
        });
        return errors;
    }

    setParts(parts) {
        this.parts = parts;
    }

    setSchemaRoot(root) {
        this.schemas.root = this.parts.length === 1 && this.parts[0] === "__default" ? null : root;
        this.schemas.part = this.parts.length === 1 && this.parts[0] === "__default" ? root : this.schemas.part;
    }

    setSchemaPart(part) {
        this.schemas.part = part;
    }

    async validate(data) {
        try {
            const formData = this.data && this.data.fields && this.data.fields.__form ? JSON.parse(this.data.fields.__form) : this.data || data;
            // const formData = this.body || data || JSON.parse(this.body.__form);
            let errors = [];
            if (this.schemas.part) {
                await Promise.allSettled(this.parts.map(async part => {
                    if (formData[part]) {
                        const valid = this.ajv.validate(this.schemas.part, formData[part]);
                        if (!valid) {
                            errors = [...errors, ...this.ajv.errors.map(e => ({
                                ...e,
                                part
                            }))];
                        }
                        const fileErrors = await this._validateFiles(formData[part], part);
                        if (fileErrors.length) {
                            errors = [...errors, ...fileErrors];
                        }
                        delete formData[part];
                    }
                }));
            }
            if (this.schemas.root) {
                const valid = this.ajv.validate(this.schemas.root, formData);
                if (!valid) {
                    errors = [...errors, ...this.ajv.errors];
                }
                const fileErrors = await this._validateFiles(formData);
                if (fileErrors.length) {
                    errors = [...errors, ...fileErrors];
                }
            }
            return {
                failed: errors.length > 0,
                error: errors.length > 0 ? "Validation error" : "",
                errorData: errors
            };
        } catch (e) {
            return {
                failed: true,
                error: e.message,
                errorData: []
            };
        }
    }

    getData() {
        const data = {};
        const formData = this.data && this.data.fields && this.data.fields.__form ? JSON.parse(this.data.fields.__form) : this.data || {};
        this.parts.map(part => {
            if (formData[part]) {
                data[part] = {};
                Object.keys(this.schemas.part.properties).map(field => {
                    data[part][field] = formData[part][field];
                    if (formData[part][field] && this.schemas.part.properties[field].zoiaConvert) {
                        switch (this.schemas.part.properties[field].zoiaConvert) {
                            case "YYYYMMDD":
                                data[part][field] = parse(formData[part][field], "yyyyMMdd", new Date());
                                break;
                        }
                    }
                });
            }
        });
        if (this.schemas.root) {
            Object.keys(this.schemas.root.properties).map(field => {
                data[field] = formData[field];
                if (formData[field] && this.schemas.root.properties[field].zoiaConvert) {
                    switch (this.schemas.root.properties[field].zoiaConvert) {
                        case "YYYYMMDD":
                            data[field] = parse(formData[field], "yyyyMMdd", new Date());
                            break;
                    }
                }
            });
        }
        return data;
    }

    getDefaultRawData() {
        const data = {};
        const formData = this.data && this.data.fields && this.data.fields.__form ? JSON.parse(this.data.fields.__form) : this.data || {};
        if (this.schemas.root) {
            Object.keys(this.schemas.root.properties).map(field => {
                data[field] = formData.__default[field];
                if (formData[field] && this.schemas.root.properties[field].zoiaConvert) {
                    switch (this.schemas.root.properties[field].zoiaConvert) {
                        case "YYYYMMDD":
                            data[field] = parse(formData[field], "yyyyMMdd", new Date());
                            break;
                    }
                }
                if (data[field] === undefined) {
                    delete data[field];
                }
            });
        }
        if (formData.ids) {
            data.ids = formData.ids;
        }
        return data;
    }

    getFiles(type = "file") {
        const formData = this.data && this.data.fields && this.data.fields.__form ? JSON.parse(this.data.fields.__form) : null;
        if (!formData) {
            return [];
        }
        const files = [];
        if (this.schemas.part) {
            this.parts.map(part => {
                if (formData[part]) {
                    Object.keys(formData[part]).map(i => {
                        const item = formData[part][i];
                        if (item && typeof item === "object" && Array.isArray(item)) {
                            (item || []).map(ai => {
                                if (ai && typeof ai === "object" && ai.type === type && ai.upload) {
                                    delete ai.upload;
                                    delete ai.type;
                                    files.push(ai);
                                }
                            });
                        }
                    });
                    delete formData[part];
                }
            });
        }
        if (this.schemas.root) {
            Object.keys(formData).map(i => {
                const item = formData[i];
                if (item && typeof item === "object" && Array.isArray(item)) {
                    (item || []).map(ai => {
                        if (ai && typeof ai === "object" && ai.type === type && ai.upload) {
                            delete ai.upload;
                            delete ai.type;
                            files.push(ai);
                        }
                    });
                }
            });
        }
        return files;
    }

    filterDataFiles(formData) {
        const data = cloneDeep(formData);
        if (this.schemas.part) {
            this.parts.map(part => {
                if (data[part]) {
                    Object.keys(data[part]).map(i => {
                        const item = data[part][i];
                        if (item && typeof item === "object" && Array.isArray(item)) {
                            (item || []).map(ai => {
                                if (ai && typeof ai === "object" && ai.type === "file" && ai.upload) {
                                    delete ai.upload;
                                    if (this.data && this.data.files && this.data.files[ai.id]) {
                                        ai.size = this.data.files[ai.id].size;
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
        if (this.schemas.root) {
            Object.keys(formData).map(i => {
                const item = formData[i];
                if (item && typeof item === "object" && Array.isArray(item)) {
                    (item || []).map(ai => {
                        if (ai && typeof ai === "object" && ai.type === "file" && ai.upload) {
                            delete ai.upload;
                            if (this.data && this.data.files && this.data.files[ai.id]) {
                                ai.size = this.data.files[ai.id].size;
                            }
                        }
                    });
                }
            });
        }
        return data;
    }

    extractFiles(data, type = "file") {
        const files = [];
        if (this.schemas.part) {
            this.parts.map(part => {
                if (data[part]) {
                    Object.keys(data[part]).map(i => {
                        const item = data[part][i];
                        if (item && typeof item === "object" && Array.isArray(item)) {
                            (item || []).map(ai => {
                                if (ai && typeof ai === "object" && ai.type === type) {
                                    files.push(ai.id);
                                }
                            });
                        }
                    });
                }
            });
        }
        if (this.schemas.root) {
            Object.keys(data).map(i => {
                const item = data[i];
                if (item && typeof item === "object" && Array.isArray(item)) {
                    (item || []).map(ai => {
                        if (ai && typeof ai === "object" && ai.type === type) {
                            files.push(ai.id);
                        }
                    });
                }
            });
        }
        return files;
    }
}
