import {
    ObjectId
} from "mongodb";
import testDelete from "./data/testDelete.json";

export default () => ({
    schema: {
        body: testDelete.root
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
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
            // Delete requested IDs
            const result = await this.mongo.db.collection(req.zoiaModulesConfig["test"].collectionTest).deleteMany({
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
