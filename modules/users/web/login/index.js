import template from "./index.marko";
import Auth from "../../../../shared/lib/auth";

export default fastify => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, fastify, req, rep);
        try {
            const site = new req.ZoiaSite(req, "users");
            if (await auth.getUserData()) {
                return rep.redirectToQuery(req, rep, site);
            }
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates.available[0],
                    pageTitle: site.i18n.t("login"),
                    ...site.getGlobals()
                }
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
