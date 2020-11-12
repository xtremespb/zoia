import {
    ObjectId
} from "mongodb";
import aclLoad from "./data/aclLoad.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const response = new this.Response(req, rep);
        const log = new this.LoggerHelpers(req, this);
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        const extendedValidation = new req.ExtendedValidation(req.body, aclLoad);
        const extendedValidationResult = extendedValidation.validate();
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        try {
            const data = await this.mongo.db.collection(req.zoiaModulesConfig["acl"].collectionAcl).findOne({
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
            const dataProcessed = {
                _id: data._id,
                group: data.group,
            };
            Object.keys(this.zoiaConfig.languages).map(lang => {
                dataProcessed[lang] = data[lang];
            });
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
