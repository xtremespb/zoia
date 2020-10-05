import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["nav"].routes.admin, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["nav"].routes.admin}`, admin());
};
