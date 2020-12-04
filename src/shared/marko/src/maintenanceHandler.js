import maintenance from "./maintenance/index.marko";
import Auth from "../../lib/auth";
import C from "../../lib/constants";

export default async (req, rep, fastify) => {
    const db = fastify.mongo.client.db(fastify.zoiaConfig.mongo.dbName);
    const maintenanceDb = await db.collection(fastify.zoiaConfig.collections.registry).findOne({
        _id: "core_maintenance"
    });
    const maintenanceStatus = maintenanceDb ? maintenanceDb.status : false;
    if (maintenanceStatus) {
        const auth = new Auth(db, fastify, req, rep, C.USE_COOKIE_FOR_TOKEN);
        const site = new req.ZoiaSite(req, null, db);
        await auth.getUserData();
        site.setAuth(auth);
        const render = await maintenance.render({
            $global: {
                serializedGlobals: {
                    pageTitle: true,
                    ...site.getSerializedGlobals()
                },
                pageTitle: site.i18n.t("maintenanceTitle"),
                ...await site.getGlobals()
            },
            maintenanceTitle: site.i18n.t("maintenanceTitle"),
            maintenanceMessage: site.i18n.t("maintenanceMessage")
        });
        if (!req.urlData().path.match(/^\/api\//) && !req.urlData().path.match(/\/admin/) && !req.urlData().path.match(/^\/zoia\//)) {
            rep.code(200).type("text/html").send(render.out.stream._content);
        }
    }
};
