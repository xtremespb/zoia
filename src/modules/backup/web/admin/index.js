import Auth from "../../../../shared/lib/auth";
import template from "./template.marko";
import C from "../../../../shared/lib/constants";
import moduleData from "../../module.json";

export default routeId => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
        try {
            const site = new req.ZoiaSite(req, "backup");
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return rep.redirectToLogin(req, rep, site, req.zoiaModulesConfig["backup"].routes.admin);
            }
            site.setAuth(auth);
            const backupDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "backup"
            });
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        routeId: true,
                        routeParams: true,
                        routes: true,
                        backupDb: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    routeId,
                    routeParams: req.params || {},
                    routes: {
                        ...req.zoiaModulesConfig["backup"].routes,
                    },
                    backupDb,
                    ...site.getGlobals()
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
