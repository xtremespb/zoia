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
        if (!acl.checkPermission("core", "read")) {
            response.requestAccessDeniedError();
            return;
        }
        try {
            return response.successJSON(req.zoiaBuildJson);
        } catch (e) {
            log.error(e);
            return Promise.reject(e);
        }
    }
});
