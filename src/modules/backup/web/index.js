import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["backup"].routes.admin, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["backup"].routes.admin}`, admin());
};
