import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["files"].routes.admin, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["files"].routes.admin}`, admin());
};
