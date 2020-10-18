import admin from "./admin";
import frontend from "./frontend";
import download from "./download";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["cm"].routes.admin, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["cm"].routes.admin}`, admin());
    fastify.get(fastify.zoiaModulesConfig["cm"].routes.frontend, frontend());
    fastify.get(`/:language${fastify.zoiaModulesConfig["cm"].routes.frontend}`, frontend());
    fastify.get(fastify.zoiaModulesConfig["cm"].routes.download, download());
};
