import Auth from "../../../../shared/lib/auth";
import C from "../../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const log = new this.LoggerHelpers(req);
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
        const site = new req.ZoiaSite(req, "users", this.mongo.db);
        const response = new this.Response(req, rep, site);
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
