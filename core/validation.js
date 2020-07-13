module.exports = class Validation {
    checkRequest(req, data) {
        let result = {};
        for (let key in data) {
            const item = data[key];
            result[key] = {};
            let field;
            if (req[key] !== undefined) {
                field = req[key];
            } else if (req.body || req.query) {
                field = req.body[key] || req.query[key];
            }
            result[key].success = false;
            // Check if field exists
            if (!item.mandatoryCreate && !field) {
                result[key].value = '';
                result[key].success = true;
                continue;
            }
            if (item.mandatoryCreate && !field) {
                result[key].errorCode = 1;
                continue;
            }
            // Check field length
            if (item.length) {
                if (item.length.min && field.length < item.length.min) {
                    result[key].errorCode = 2;
                    continue;
                }
                if (item.length.max && field.length > item.length.max) {
                    result[key].errorCode = 3;
                    continue;
                }
            }
            // Check field type
            if (item.type) {
                if (typeof field !== item.type) {
                    result[key].errorCode = 4;
                    continue;
                }
            }
            // Process value with function
            if (item.process) {
                field = item.process(field);
            }
            // Check regexp
            if (item.regexp) {
                if (!field.match(item.regexp)) {
                    result[key].errorCode = 5;
                    continue;
                }
            }
            // Finally, no errors
            result[key].value = field;
            result[key].success = true;
        }
        return result;
    }
    getCheckRequestFailedFields(data) {
        let result = [];
        for (let key in data) {
            let item = data[key];
            if (!item.success) {
                result.push(key);
            }
        }
        return result;
    }
    getFieldValues(data) {
        let result = {};
        for (let key in data) {
            if (data[key].value) {
                result[key] = data[key].value;
            }
        }
        return result;
    }
};