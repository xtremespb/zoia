import admin from "./admin";
import frontend from "./frontend";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["cm"].routes.admin, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["cm"].routes.admin}`, admin());
    fastify.get(fastify.zoiaModulesConfig["cm"].routes.frontend, frontend());
    fastify.get(`/:language${fastify.zoiaModulesConfig["cm"].routes.frontend}`, frontend());
};
