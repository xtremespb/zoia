import {
    ObjectId
} from "mongodb";
import deleteData from "./data/filterDelete.json";
import moduleConfig from "../module.json";

export default () => ({
    schema: {
        body: deleteData.root
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
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
            // Delete requested IDs
            const result = await this.mongo.db.collection(req.zoiaModulesConfig[moduleConfig.id].collectionFilters).deleteMany(queryDb);
            // Check result
            if (!result || !result.result || !result.result.ok) {
                response.deleteError();
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
