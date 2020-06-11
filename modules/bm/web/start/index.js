import template from "./index.marko";
import utils from "../../../../shared/lib/utils";
import i18nDb from "../../locales/database.json";

export default () => ({
    async handler(req, rep) {
        try {
            const moduleConfig = {
                frontend: req.zoiaModulesConfig["bm"].frontend,
                routes: req.zoiaModulesConfig["bm"].routes
            };
            const site = new req.ZoiaSite(req, "bm");
            let countries = (await this.mongo.db.collection("countries").find({}).toArray()).map(c => ({
                _id: c._id,
                name: c.name,
                region: c.worldRegion
            }));
            i18nDb[site.language] = i18nDb[site.language] || {};
            countries.map(c => c.name = i18nDb[site.language][c.name] || c.name);
            // Sort by names
            countries = countries.sort(utils.sortByName);
            // Render
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        countries: true,
                        moduleConfig: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaModulesConfig["bm"].templates && req.zoiaModulesConfig["bm"].templates.start ? req.zoiaModulesConfig["bm"].templates.start : req.zoiaTemplates.available[0],
                    pageTitle: site.i18n.t("moduleTitle"),
                    countries,
                    moduleConfig,
                    ...site.getGlobals()
                },
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
