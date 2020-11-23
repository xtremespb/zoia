import admin from "./admin";
import download from "./download";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["backup"].routes.backup, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["backup"].routes.backup}`, admin());
    fastify.get(fastify.zoiaModulesConfig["backup"].routes.download, download());
};
