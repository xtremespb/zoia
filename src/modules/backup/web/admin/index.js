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
            const site = new req.ZoiaSite(req, "backup", this.mongo.db);
            response.setSite(site);
            if (!auth.statusAdmin()) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["backup"].routes.backup);
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
                        routeDownload: true,
                        accessAllowed: true,
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
                    routeDownload: req.zoiaModulesConfig["backup"].routes.download,
                    accessAllowed: acl.checkPermission("backup", "read"),
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
