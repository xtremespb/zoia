import template from "./template.marko";
import moduleData from "../../module.json";

export default routeId => ({
    async handler(req) {
        try {
            const {
                response,
                auth,
                acl
            } = req.zoia;
            const site = new req.ZoiaSite(req, "users", this.mongo.db);
            if (!auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["users"].routes.admin);
            }
            site.setAuth(auth);
            // Init ACL
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
                        ...req.zoiaModulesConfig["users"].routes,
                        ...req.zoiaConfig.routes.login
                    },
                    accessAllowed: acl.checkPermission("users", "read"),
                    ...await site.getGlobals()
                },
                modules: req.zoiaModules,
                moduleId: moduleData.id,
            });
            return response.sendHTML(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
