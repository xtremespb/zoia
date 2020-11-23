import template from "./template.marko";
import moduleData from "../../module.json";

export default () => ({
    async handler(req) {
        try {
            const {
                response,
                auth,
            } = req.zoia;
            const site = new req.ZoiaSite(req, "core", this.mongo.db);
            response.setSite(site);
            if (!auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["core"].routes.core);
            }
            site.setAuth(auth);
            const maintenanceDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "core_maintenance"
            });
            const maintenanceStatus = maintenanceDb ? maintenanceDb.status : false;
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        usersOnline: true,
                        maintenanceStatus: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    usersOnline: Object.keys(req.io.sockets.sockets).length,
                    maintenanceStatus,
                    ...await site.getGlobals(),
                },
                modules: req.zoiaAdmin,
                version: req.zoiaPackageJson.version,
                moduleId: moduleData.id,
            });
            return response.sendHTML(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
