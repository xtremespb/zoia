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
            return response.successJSON(req.zoiaBuildJson);
        } catch (e) {
            log.error(e);
            return Promise.reject(e);
        }
    }
});
