import error404 from "./error404/index.marko";
import Auth from "../../lib/auth";
import C from "../../lib/constants";

export default async (req, rep, fastify) => {
    const log = new fastify.LoggerHelpers(req, fastify);
    const db = fastify.mongo.client.db(fastify.zoiaConfig.mongo.dbName);
    const auth = new Auth(db, fastify, req, rep, C.USE_COOKIE_FOR_TOKEN);
    const site = new req.ZoiaSite(req, null, db);
    await auth.getUserData();
    site.setAuth(auth);
    const render = await error404.stream({
        $global: {
            serializedGlobals: {
                template: true,
                pageTitle: true,
                ...site.getSerializedGlobals()
            },
            template: req.zoiaTemplates[0],
            pageTitle: site.i18n.t("notFound"),
            ...await site.getGlobals()
        }
    });
    log.warn("Not Found");
    req.urlData().path.match(/^\/api\//) ? rep.code(404).type("application/json").send({
        errorMessage: "Not Found"
    }) : rep.code(404).type("text/html").send(render);
};
