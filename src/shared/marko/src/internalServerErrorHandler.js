import errorInternal from "./errorInternal/index.marko";

export default async (err, req, rep) => {
    let errorCode;
    let errorText;
    let errorTitle;
    let errorMessage;
    const site = new req.ZoiaSite(req);
    switch (err.code) {
    case 403:
        errorCode = 403;
        errorText = "Forbidden";
        errorTitle = site.i18n.t("forbiddenError");
        errorMessage = site.i18n.t("forbiddenErrorMsg");
        break;
    case 429:
        errorCode = 429;
        errorText = "Rate Limit Exceeded";
        errorTitle = site.i18n.t("rateError");
        errorMessage = site.i18n.t("rateErrorMsg");
        break;
    default:
        errorCode = 500;
        errorText = "Internal Server Error";
        errorTitle = site.i18n.t("internalError");
        errorMessage = site.i18n.t("internalErrorMsg");
    }
    const render = await errorInternal.stream({
        $global: {
            serializedGlobals: {
                pageTitle: true,
                ...site.getSerializedGlobals()
            },
            pageTitle: errorTitle,
            ...site.getGlobals()
        },
        errorTitle,
        errorMessage
    });
    rep.logError(req, errorText, err);
    req.urlData().path.match(/^\/api\//) ? rep.code(errorCode).type("application/json").send({
        errorMessage: errorText
    }) : rep.code(errorCode).type("text/html").send(render);
};
