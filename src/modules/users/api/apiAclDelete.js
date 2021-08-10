import {
    ObjectId
} from "mongodb";
import aclDelete from "./data/aclDelete.json";

export default () => ({
    schema: {
        body: aclDelete.root
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
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
            // Get requested data
            const dataDb = await this.mongo.db.collection(req.zoiaModulesConfig["users"].collectionAcl).find(queryDb, {
                projection: {
                    group: 1
                }
            }).toArray();
            // Check permission
            let allowed = true;
            (dataDb || []).map(i => {
                if (allowed && !acl.checkPermission("users", "delete", i.username)) {
                    allowed = false;
                }
            });
            if (!allowed) {
                response.requestAccessDeniedError();
                return;
            }
            let result;
            if (req.body.recycle) {
                result = await this.mongo.db.collection(req.zoiaModulesConfig["users"].collectionAcl).updateMany(queryDb, {
                    $set: {
                        deletedAt: new Date(),
                    }
                }, {
                    upsert: false
                });
            } else {
                // Delete requested IDs
                result = await this.mongo.db.collection(req.zoiaModulesConfig["users"].collectionAcl).deleteMany(queryDb);
            }
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
