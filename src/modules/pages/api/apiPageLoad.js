import {
    ObjectId
} from "mongodb";
import pageLoad from "./data/pageLoad.json";
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
