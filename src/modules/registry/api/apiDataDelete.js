import dataDelete from "./data/dataDelete.json";

export default () => ({
    schema: {
        body: dataDelete.root
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
        try {
            // Build query
            const queryDb = {
                $or: req.body.ids.map(id => ({
                    _id: id
                }))
            };
            // Get requested data
            const dataDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).find(queryDb, {
                projection: {
                    username: 1
                }
            }).toArray();
            // Check permission
            let allowed = true;
            (dataDb || []).map(i => {
                if (allowed && !acl.checkPermission("registry", "delete", i._id)) {
                    allowed = false;
                }
            });
            if (!allowed) {
                response.requestAccessDeniedError();
                return;
            }
            // Delete requested IDs
            const result = await this.mongo.db.collection(req.zoiaConfig.collections.registry).deleteMany(queryDb);
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
