import {
    ObjectId
} from "mongodb";
import deleteData from "./data/pageDelete.json";
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
            acl
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
        const {
            collectionPages
        } = req.zoiaModulesConfig[moduleConfig.id];
        try {
            // Build query
            const queryDb = {
                $or: req.body.ids.map(id => ({
                    _id: new ObjectId(id)
                }))
            };
            // Get requested data
            const dataDb = await this.mongo.db.collection(collectionPages).find(queryDb, {
                projection: {
                    uid: 1
                }
            }).toArray();
            // Check permission
            let allowed = true;
            (dataDb || []).map(i => {
                if (allowed && !acl.checkPermission(moduleConfig.id, "delete", i.uid)) {
                    allowed = false;
                }
            });
            if (!allowed) {
                response.requestAccessDeniedError();
                return;
            }
            // Restore
            const result = await this.mongo.db.collection(collectionPages).updateMany(queryDb, {
                $set: {
                    deletedAt: null
                }
            }, {
                upsert: false
            });
            // Check result
            if (!result || !result.acknowledged) {
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
