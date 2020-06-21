import {
    ObjectId
} from "mongodb";
import pageDelete from "./data/pageDelete.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default fastify => ({
    schema: {
        body: pageDelete.root
    },
    attachValidation: true,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, fastify, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
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
                rep.requestError(rep, {
                    failed: true,
                    error: "Could not delete one or more items",
                    errorKeyword: "deleteError",
                    errorData: []
                });
                return;
            }
            // Send "success" result
            rep.successJSON(rep);
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
