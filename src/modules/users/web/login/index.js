import template from "./index.marko";
import Auth from "../../../../shared/lib/auth";

export default () => ({
    async handler(req, rep) {
        try {
            const auth = new Auth(this.mongo.db, this, req, rep);
            const site = new req.ZoiaSite(req, "users", this.mongo.db);
            if (await auth.getUserData()) {
                return rep.redirectToQuery(req, rep, site);
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
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
