import fs from "fs-extra";
import path from "path";
import Auth from "../../../../shared/lib/auth";
import template from "./template.marko";
import C from "../../../../shared/lib/constants";
import moduleData from "../../module.json";

export default () => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
        try {
            const site = new req.ZoiaSite(req, "cm", this.mongo.db);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return rep.redirectToLogin(req, rep, site, req.zoiaModulesConfig["cm"].routes.admin);
            }
            site.setAuth(auth);
            const dir = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${req.zoiaModulesConfig["cm"].directory}`);
            const files = await fs.readdir(dir);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        files: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("adminPanel")}`,
                    files,
                    ...await site.getGlobals(),
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
