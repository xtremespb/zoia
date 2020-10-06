import Auth from "../../../../shared/lib/auth";
import C from "../../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
        const site = new req.ZoiaSite(req, "users", this.mongo.db);
        await auth.getUserData();
        site.setAuth(auth);
        try {
            await auth.logout();
            return rep.redirectToRoot(req, rep, site);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
