export default () => ({
    attachValidation: false,
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
        if (!acl.checkPermission("users", "delete")) {
            response.requestAccessDeniedError();
            return;
        }
        try {
            const result = await this.mongo.db.collection(req.zoiaModulesConfig["users"].collectionUsers).deleteMany({
                deletedAt: {
                    $ne: null
                }
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
