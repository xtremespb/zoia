import template from "./index.marko";
import Auth from "../../../../shared/lib/auth";

export default () => ({
    async handler(req, rep) {
        const log = new this.LoggerHelpers(req, this);
        try {
            const auth = new Auth(this.mongo.db, this, req, rep);
            const site = new req.ZoiaSite(req, "users", this.mongo.db);
            const response = new this.Response(req, rep, site);
            if (await auth.getUserData()) {
                return response.redirectToQuery();
            }
            site.setAuth(auth);
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates[0],
                    pageTitle: site.i18n.t("login"),
                    ...await site.getGlobals()
                }
            });
            return response.sendHTML(render);
        } catch (e) {
            log.error(e);
            return Promise.reject(e);
        }
    }
});
