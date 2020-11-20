import {
    ObjectId
} from "mongodb";
import pageLoad from "./data/pageLoad.json";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        // Check permissions
        if (!auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        // Extended validation
        const extendedValidation = new req.ExtendedValidation(req.body, pageLoad);
        const extendedValidationResult = extendedValidation.validate();
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        try {
            const data = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!data) {
                response.requestError({
                    failed: true,
                    error: "Database error",
                    errorKeyword: "pageNotFound",
                    errorData: []
                });
                return;
            }
            // Check permission
            if (!acl.checkPermission("pages", "read", data.filename)) {
                response.requestError({
                    failed: true,
                    error: "Access Denied",
                    errorKeyword: "accessDenied",
                    errorData: []
                });
                return;
            }
            data.dir = {
                data: data.dir
            };
            response.successJSON({
                data
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
