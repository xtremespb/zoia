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
            const site = new req.ZoiaSite(req, "update", this.mongo.db);
            response.setSite(site);
            if (!auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return response.redirectToLogin(req.zoiaModulesConfig["update"].routes.admin);
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
                    accessAllowed: acl.checkPermission("update", "read"),
                    ...await site.getGlobals(),
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
