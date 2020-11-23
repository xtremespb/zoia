import template from "./template.marko";
import moduleData from "../../module.json";

export default routeId => ({
    async handler(req) {
        try {
            const {
                acl,
                response,
                auth,
            } = req.zoia;
            const site = new req.ZoiaSite(req, "test", this.mongo.db);
            response.setSite(site);
            if (!auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["test"].routes.test);
            }
            site.setAuth(auth);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        routeId: true,
                        routeParams: true,
                        routes: true,
                        accessAllowed: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    routeId,
                    routeParams: req.params || {},
                    routes: {
                        ...req.zoiaModulesConfig["test"].routes,
                        ...req.zoiaConfig.routes
                    },
                    accessAllowed: acl.checkPermission("test", "read"),
                    ...await site.getGlobals()
                },
                modules: req.zoiaAdmin,
                moduleId: moduleData.id,
            });
            return response.sendHTML(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
