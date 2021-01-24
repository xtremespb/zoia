export default () => ({
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
        try {
            if (!acl.checkPermission("backup", "update")) {
                response.requestAccessDeniedError();
                return;
            }
            const backupDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "backup"
            });
            if (!backupDb && !backupDb.running) {
                response.requestError({
                    failed: true,
                    error: "Backup process is not started",
                    errorKeyword: "backupNotStarted",
                    errorData: []
                });
                return;
            }
            await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                _id: "backup"
            }, {
                $set: {
                    running: false
                }
            }, {
                upsert: true
            });
            // Send response
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
