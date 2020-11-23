export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        // Check permissions
        if (!auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkPermission("core", "read")) {
            response.requestError({
                failed: true,
                error: "Access Denied",
                errorKeyword: "accessDenied",
                errorData: []
            });
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
