import {
    ObjectId
} from "mongodb";
import aclLoad from "./data/aclLoad.json";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        const extendedValidation = new req.ExtendedValidation(req.body, aclLoad);
        const extendedValidationResult = await extendedValidation.validate();
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        try {
            const data = await this.mongo.db.collection(req.zoiaModulesConfig["users"].collectionAcl).findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!data) {
                response.requestError({
                    failed: true,
                    error: "Database error",
                    errorKeyword: "aclNotFound",
                    errorData: []
                });
                return;
            }
            // Check permission
            if (!acl.checkPermission("users", "read", data.group)) {
                response.requestAccessDeniedError();
                return;
            }
            const dataProcessed = {
                _id: data._id,
                group: data.group,
                comment: data.comment
            };
            this.zoiaConfig.modules.map(m => {
                dataProcessed[`${m}_access`] = data[`${m}_access`] || [];
                dataProcessed[`${m}_whitelist`] = data[`${m}_whitelist`] ? data[`${m}_whitelist`].join(", ") : "";
                dataProcessed[`${m}_blacklist`] = data[`${m}_blacklist`] ? data[`${m}_blacklist`].join(", ") : "";
            });
            response.successJSON({
                data: dataProcessed
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
