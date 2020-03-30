import error500 from "../error500/index.marko";

export default async (err, req, rep) => {
    const language = req.zoiaSite.languages[0];
    req.zoiaSite.i18n.setLanguage(language);
    const render = await error500.stream({
        $global: {
            serializedGlobals: {
                pageTitle: true,
                ...req.zoiaSite.serializedGlobals
            },
            pageTitle: req.zoiaSite.i18n.t("internal_error"),
            ...req.zoiaSite.globals(language)
        }
    });
    rep.logError(req, "Internal Server Error", err);
    rep.code(500).type("text/html").send(render);
};
