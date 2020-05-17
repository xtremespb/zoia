import template from "./index.marko";

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
