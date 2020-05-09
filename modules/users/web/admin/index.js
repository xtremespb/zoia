import template from "./template.marko";

export default (fastify, routeId) => ({
    async handler(req, rep) {
        try {
            const site = new req.ZoiaSite(req, "users");
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        routeId: true,
                        routeParams: true,
                        ...site.getSerializedGlobals()
                    },
                    template: "admin",
                    pageTitle: `${site.i18n.t("moduleTitle")} | ${site.i18n.t("admin_panel")}`,
                    routeId,
                    routeParams: req.params || {},
                    ...site.getGlobals()
                },
                modules: req.zoiaModules
            });
            return rep.code(200).type("text/html").send(render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
