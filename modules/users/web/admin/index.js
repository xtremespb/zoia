import template from "./template.marko";

export default () => ({
    async handler(req, rep) {
        try {
            const site = new req.ZoiaSite(req, "users");
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: site.i18n.t("users"),
                    ...site.getGlobals()
                }
            });
            return rep.code(200).type("text/html").send(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
