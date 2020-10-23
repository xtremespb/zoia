import Auth from "../../../../shared/lib/auth";
import template from "./template.marko";
import C from "../../../../shared/lib/constants";
import moduleData from "../../module.json";

export default routeId => ({
    async handler(req, rep) {
        try {
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
            const site = new req.ZoiaSite(req, "users", this.mongo.db);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return rep.redirectToLogin(req, rep, site, req.zoiaModulesConfig["users"].routes.admin);
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
                    ...await site.getGlobals()
                },
                modules: req.zoiaModules,
                moduleId: moduleData.id,
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
