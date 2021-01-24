export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        try {
            // Check permissions
            if (!auth.statusAdmin()) {
                response.unauthorizedError();
                return;
            }
            if (!acl.checkPermission("core", "read")) {
                response.requestAccessDeniedError();
                return;
            }
            const registry = (await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "update"
            })) || {
                status: null
            };
            response.successJSON({
                status: registry.status
            });
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
