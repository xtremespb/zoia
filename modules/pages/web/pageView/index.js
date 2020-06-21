import template from "./index.marko";
// import Auth from "../../../../shared/lib/auth";

export default () => ({
    async handler(req, rep) {
        // const auth = new Auth(this.mongo.db, fastify, req, rep);
        try {
            const site = new req.ZoiaSite(req, "pages");
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates.available[0],
                    pageTitle: site.i18n.t("T i t l e"),
                    ...site.getGlobals()
                }
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
