import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["update"].routes.admin, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["update"].routes.admin}`, admin());
};
