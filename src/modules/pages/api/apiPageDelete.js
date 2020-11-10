import {
    ObjectId
} from "mongodb";
import pageDelete from "./data/pageDelete.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    schema: {
        body: pageDelete.root
    },
    attachValidation: true,
    async handler(req, rep) {
        const response = new this.Response(req, rep); const log = new this.LoggerHelpers(req, this);
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError.message);
            response.validationError(req.validationError);
            return;
        }
        try {
            // Delete requested IDs
            const result = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).deleteMany({
                $or: req.body.ids.map(id => ({
                    _id: new ObjectId(id)
                }))
            });
            // Check result
            if (!result || !result.result || !result.result.ok) {
                response.requestError({
                    failed: true,
                    error: "Could not delete one or more items",
                    errorKeyword: "deleteError",
                    errorData: []
                });
                return;
            }
            // Send "success" result
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
