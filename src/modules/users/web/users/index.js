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
            if (!auth.statusAdmin()) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["users"].routes.users);
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
                    pageTitle: `${site.i18n.t(`moduleTitle.${moduleData.id}`)} | ${site.i18n.t("adminPanel")}`,
                    routeId,
                    routeParams: req.params || {},
                    routes: {
                        ...req.zoiaModulesConfig["users"].routes,
                        ...req.zoiaConfig.routes.login
                    },
                    accessAllowed: acl.checkPermission("users", "read"),
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
