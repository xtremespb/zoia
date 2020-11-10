import cloneDeep from "lodash/cloneDeep";
import Auth from "../../../shared/lib/auth";
import dataEdit from "./data/dataEdit.json";
import C from "../../../shared/lib/constants";

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
    async handler(req, rep) {
        const response = new this.Response(req, rep); const log = new this.LoggerHelpers(req, this);
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        // Clone root validation schema
        const dataEditRoot = cloneDeep(dataEdit.root);
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(req.body, dataEditRoot);
        // Perform validation
        const extendedValidationResult = extendedValidation.validate();
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
            if (!update || !update.result || !update.result.ok) {
                response.requestError({
                    failed: true,
                    error: "Database error",
                    errorKeyword: "databaseError",
                    errorData: []
                });
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
