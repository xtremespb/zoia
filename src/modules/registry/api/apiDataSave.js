import cloneDeep from "lodash/cloneDeep";
import dataEdit from "./data/dataEdit.json";

const traverse = obj => {
    Object.keys(obj).map(k => {
        if (k && typeof k === "object") {
            traverse(obj);
        }
        if (k.match(/At$/)) {
            const valDate = new Date(obj[k]);
            if (valDate instanceof Date && !Number.isNaN(valDate)) {
                obj[k] = valDate;
            }
        }
    });
};

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        // Clone root validation schema
        const dataEditRoot = cloneDeep(dataEdit.root);
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(req.body, dataEditRoot);
        // Perform validation
        const extendedValidationResult = await extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        // Get data from form body
        const data = extendedValidation.getData();
        try {
            // Validate value
            try {
                data.value = JSON.parse(data.value);
                traverse(data.value);
            } catch {
                response.requestError({
                    failed: true,
                    error: "Could not parse JSON object",
                    errorKeyword: "invalidJSON",
                    errorData: []
                });
                return;
            }
            // Check permission
            if (!acl.checkPermission("registry", "create") || !acl.checkPermission("registry", "update", data._id)) {
                response.requestAccessDeniedError();
                return;
            }
            // Update database
            const update = await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne(data._id ? {
                _id: data._id
            } : {}, {
                $set: {
                    _id: data._id,
                    ...data.value
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.acknowledged) {
                response.databaseError();
                return;
            }
            // Return "success" result
            response.successJSON();
            return;
        } catch (e) {
            // There is an exception, send error 500 as response
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
