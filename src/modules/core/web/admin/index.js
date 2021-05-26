import axios from "axios";
import template from "./template.marko";
import moduleData from "../../module.json";

export default () => ({
    async handler(req) {
        try {
            const {
                response,
                auth,
                acl,
            } = req.zoia;
            const site = new req.ZoiaSite(req, "core", this.mongo.db);
            response.setSite(site);
            if (!auth.statusAdmin()) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["core"].routes.core);
            }
            site.setAuth(auth);
            const maintenanceDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "core_maintenance"
            });
            const updateDb = (await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "update"
            })) || {
                status: null
            };
            const maintenanceStatus = maintenanceDb ? maintenanceDb.status : false;
            const updateStatus = updateDb ? updateDb.status : null;
            let updateData = null;
            try {
                updateData = (await axios({
                    method: "get",
                    url: req.zoiaConfig.update,
                })).data;
            } catch {
                // Ignore
            }
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        usersOnline: true,
                        maintenanceStatus: true,
                        updateStatus: true,
                        buildJson: true,
                        pid: true,
                        updateData: true,
                        packageJson: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    usersOnline: Object.keys(req.io.sockets.sockets).length,
                    maintenanceStatus,
                    updateStatus,
                    buildJson: req.zoiaBuildJson,
                    pid: process.pid,
                    updateData,
                    packageJson: this.zoiaPackageJson,
                    ...await site.getGlobals(),
                },
                modules: req.zoiaAdmin.map(m => ({
                    ...m,
                    allowed: acl.checkPermission(m.id, "read")
                })),
                version: req.zoiaPackageJson.version,
                moduleId: moduleData.id,
            });
            return response.sendHTML(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
