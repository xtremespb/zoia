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
            const site = new req.ZoiaSite(req, "files", this.mongo.db);
            response.setSite(site);
            if (!auth.statusAdmin()) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["files"].routes.files);
            }
            site.setAuth(auth);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        buildJson: true,
                        pid: true,
                        accessAllowed: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    buildJson: req.zoiaBuildJson,
                    pid: process.pid,
                    accessAllowed: acl.checkPermission("files", "read"),
                    ...await site.getGlobals(),
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
