import {
    ObjectId
} from "mongodb";
import pageDelete from "./data/pageDelete.json";

export default () => ({
    schema: {
        body: pageDelete.root
    },
    attachValidation: true,
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
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError.message);
            response.validationError(req.validationError);
            return;
        }
        try {
            // Build query
            const queryDb = {
                $or: req.body.ids.map(id => ({
                    _id: new ObjectId(id)
                }))
            };
            // Get requested data
            const dataDb = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).find(queryDb, {
                projection: {
                    filename: 1
                }
            }).toArray();
            // Check permission
            let allowed = true;
            (dataDb || []).map(i => {
                if (allowed && !acl.checkPermission("pages", "delete", i.filename)) {
                    allowed = false;
                }
            });
            if (!allowed) {
                response.requestError({
                    failed: true,
                    error: "Access Denied",
                    errorKeyword: "accessDenied",
                    errorData: []
                });
                return;
            }
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
