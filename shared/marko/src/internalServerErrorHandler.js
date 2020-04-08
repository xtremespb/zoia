import error500 from "../error500/index.marko";

export default async (err, req, rep) => {
    const site = new req.ZoiaSite(req);
    const render = await error500.stream({
        $global: {
            serializedGlobals: {
                pageTitle: true,
                ...site.getSerializedGlobals()
            },
            pageTitle: site.i18n.t("internal_error"),
            ...site.getGlobals()
        }
    });
    rep.logError(req, "Internal Server Error", err);
    req.urlData().path.match(/^\/api\//) ? rep.code(500).type("application/json").send({
        errorMessage: "Internal Server Error"
    }) : rep.code(500).type("text/html").send(render);
};
