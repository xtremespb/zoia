import template from "./template.marko";
import moduleData from "../../module.json";

export default () => ({
    async handler(req) {
        try {
            const {
                acl,
                response,
                auth,
            } = req.zoia;
            const site = new req.ZoiaSite(req, "nav", this.mongo.db);
            response.setSite(site);
            if (!auth.statusAdmin()) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["nav"].routes.nav);
            }
            site.setAuth(auth);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        routes: true,
                        accessAllowed: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    routes: {
                        ...req.zoiaModulesConfig["nav"].routes,
                        ...req.zoiaConfig.routes
                    },
                    accessAllowed: acl.checkPermission("nav", "read"),
                    ...await site.getGlobals()
                },
                modules: req.zoiaAdmin.map(m => ({
                    ...m,
                    allowed: acl.checkPermission(m.id, "read")
                })),
                moduleId: moduleData.id,
            });
            return response.sendHTML(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
