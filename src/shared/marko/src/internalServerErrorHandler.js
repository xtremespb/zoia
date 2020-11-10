import errorInternal from "./errorInternal/index.marko";
import Auth from "../../lib/auth";
import C from "../../lib/constants";

export default async (err, req, rep, fastify) => {
    const log = new fastify.LoggerHelpers(req, fastify);
    let errorCode;
    let errorText;
    let errorTitle;
    let errorMessage;
    const db = fastify.mongo.client.db(fastify.zoiaConfig.mongo.dbName);
    const auth = new Auth(db, fastify, req, rep, C.USE_COOKIE_FOR_TOKEN);
    const site = new req.ZoiaSite(req, null, db);
    await auth.getUserData();
    site.setAuth(auth);
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
    const render = await errorInternal.render({
        $global: {
            serializedGlobals: {
                pageTitle: true,
                ...site.getSerializedGlobals()
            },
            pageTitle: errorTitle,
            ...await site.getGlobals()
        },
        errorTitle,
        errorMessage
    });
    log.error(err);
    req.urlData().path.match(/^\/api\//) ? rep.code(errorCode).type("application/json").send({
        errorMessage: errorText
    }) : rep.code(errorCode).type("text/html").send(render.out.stream._content);
};
