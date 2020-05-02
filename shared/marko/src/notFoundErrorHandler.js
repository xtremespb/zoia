import error404 from "./error404/index.marko";

export default async (req, rep) => {
    const site = new req.ZoiaSite(req);
    const render = await error404.stream({
        $global: {
            serializedGlobals: {
                template: true,
                pageTitle: true,
                ...site.getSerializedGlobals()
            },
            template: req.zoiaTemplates.available[0],
            pageTitle: site.i18n.t("not_found"),
            ...site.getGlobals()
        }
    });
    rep.logWarn(req, "Not Found");
    req.urlData().path.match(/^\/api\//) ? rep.code(404).type("application/json").send({
        errorMessage: "Not Found"
    }) : rep.code(404).type("text/html").send(render);
};
