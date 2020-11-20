export default () => ({
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
        try {
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
