export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        const site = new req.ZoiaSite(req, "users", this.mongo.db);
        response.setSite(site);
        await auth.getUserData();
        site.setAuth(auth);
        try {
            await auth.logout();
            return response.redirectToRoot();
        } catch (e) {
            log.error(e);
            return Promise.reject(e);
        }
    }
});
