import error404 from "../error404/index.marko";

export default async (req, rep) => {
    const language = req.zoiaSite.languages[0];
    req.zoiaSite.i18n.setLanguage(language);
    const render = await error404.stream({
        $global: {
            serializedGlobals: {
                template: true,
                pageTitle: true,
                ...req.zoiaSite.serializedGlobals
            },
            template: req.zoiaTemplates.available[0],
            pageTitle: req.zoiaSite.i18n.t("not_found"),
            ...req.zoiaSite.globals(language)
        }
    });
    rep.code(404).type("text/html").send(render);
};
