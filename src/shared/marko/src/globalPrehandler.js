import Auth from "../../lib/auth";
import C from "../../lib/constants";

export default async (req, rep, fastify) => {
    if (!req.urlData().path.match(/^\/zoia\//)) {
        const response = new fastify.Response(req, rep);
        const log = new fastify.LoggerHelpers(req, fastify);
        const db = fastify.mongo.client.db(fastify.zoiaConfig.mongo.dbName);
        const auth = new Auth(db, fastify, req, rep, C.USE_EVERYTHING_FOR_TOKEN);
        await auth.getUserData();
        const acl = new fastify.Acl(fastify);
        await acl.initGroups(auth.getUser().groups);
        req.zoia = {
            auth,
            response,
            log,
            acl
        };
    }
};
