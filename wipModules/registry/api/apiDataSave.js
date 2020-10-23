import cloneDeep from "lodash/cloneDeep";
import Auth from "../../../shared/lib/auth";
import dataEdit from "./data/dataEdit.json";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
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
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        // Get data from form body
        const data = extendedValidation.getData();
        try {
            // Check for record duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaModulesConfig["registry"].collectionRegistry, {
                    _id: {
                        $ne: req.body.id || null
                    }
                }, "dataAlreadyExists", "id")) {
                return;
            }
            // Set createdAt timestamp if that's a new record
            // Update database
            const update = await this.mongo.db.collection(req.zoiaModulesConfig["registry"].collectionRegistry).updateOne(data.id ? {
                _id: data.id
            } : {}, {
                $set: {
                    _id: data.id,
                    value: data.value
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "databaseError",
                    errorData: []
                });
                return;
            }
            // Return "success" result
            rep.successJSON(rep);
            return;
        } catch (e) {
            // There is an exception, send error 500 as response
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
