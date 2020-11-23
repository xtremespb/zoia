import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["update"].routes.update, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["update"].routes.update}`, admin());
};
