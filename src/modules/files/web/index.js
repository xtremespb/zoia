import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["files"].routes.files, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["files"].routes.files}`, admin());
};
