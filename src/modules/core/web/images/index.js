import Auth from "../../../../shared/lib/auth";
import template from "./template.marko";
import C from "../../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
        try {
            const site = new req.ZoiaSite(req, "core", this.mongo.db);
            const response = new this.Response(req, rep, site);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaConfig.routes.imagesBrowser);
            }
            site.setAuth(auth);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: site.i18n.t("moduleTitleImages"),
                    ...await site.getGlobals(),
                }
            });
            return response.sendHTML(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
