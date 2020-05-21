import Auth from "../../../../shared/lib/auth";
import template from "./template.marko";

export default (fastify, routeId) => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, fastify, req, rep);
        try {
            const site = new req.ZoiaSite(req, "users");
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return rep.redirectToLogin(req, rep, site, "/admin/users");
            }
            site.setAuth(auth);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        routeId: true,
                        routeParams: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    routeId,
                    routeParams: req.params || {},
                    ...site.getGlobals()
                },
                modules: req.zoiaModules
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
