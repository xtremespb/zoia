import template from "./index.marko";
import Auth from "../../../../shared/lib/auth";

export default fastify => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, fastify, req);
        try {
            const site = new req.ZoiaSite(req, "users");
            const token = req.cookies[`${req.zoiaConfig.siteOptions.globalPrefix || "zoia3"}.authToken`];
            if (auth.getUserData(token)) {
                rep.code(302).redirect(url);
                return;
            }
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "default",
                    pageTitle: site.i18n.t("login"),
                    ...site.getGlobals()
                }
            });
            return rep.code(200).type("text/html").send(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
