import template from "./index.marko";
// import Auth from "../../../../shared/lib/auth";

export default () => ({
    async handler(req, rep) {
        // const auth = new Auth(this.mongo.db, fastify, req, rep);
        try {
            const site = new req.ZoiaSite(req, "pages");
            const {
                url
            } = site.i18n.getNonLocalizedURL(req);
            const projection = {
                path: 1,
                createdAt: 1,
                modifiedAt: 1
            };
            ["title", "contentMin", "cssMin", "jsMin"].map(i => projection[`${site.language}.${i}`] = 1);
            const page = await this.mongo.db.collection(this.zoiaModulesConfig["pages"].collectionPages).findOne({
                path: url
            }, {
                projection
            });
            if (!page || !page[site.language]) {
                rep.callNotFound();
                return rep.code(204);
            }
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        extraCSS: true,
                        extraJS: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates.available[0],
                    pageTitle: page[site.language].title,
                    extraCSS: page[site.language].cssMin,
                    extraJS: page[site.language].jsMin,
                    ...site.getGlobals()
                },
                content: page[site.language].contentMin
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
