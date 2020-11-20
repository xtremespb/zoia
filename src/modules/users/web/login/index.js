import template from "./index.marko";

export default () => ({
    async handler(req) {
        const log = new this.LoggerHelpers(req, this);
        try {
            const {
                response,
                auth,
            } = req.zoia;
            const site = new req.ZoiaSite(req, "users", this.mongo.db);
            response.setSite(site);
            if (auth.getUser() && auth.getUser()._id) {
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
