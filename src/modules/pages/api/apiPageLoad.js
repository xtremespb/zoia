import {
    ObjectId
} from "mongodb";
import pageLoad from "./data/pageLoad.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        const extendedValidation = new req.ExtendedValidation(req.body, pageLoad);
        const extendedValidationResult = extendedValidation.validate();
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        try {
            const data = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!data) {
                rep.requestError(rep, {
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
            rep.successJSON(rep, {
                data
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
