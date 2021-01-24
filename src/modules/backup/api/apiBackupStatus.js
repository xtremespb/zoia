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
        if (!acl.checkPermission("backup", "read")) {
            response.requestAccessDeniedError();
            return;
        }
        try {
            const backupDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "backup"
            });
            if (!backupDb) {
                response.requestError({
                    failed: true,
                    error: "Backup process is not started",
                    errorKeyword: "backupNotStarted",
                    errorData: []
                });
                return;
            }
            // Send response
            response.successJSON({
                backup: backupDb
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
