import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["test"].routes.test, admin("test"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["test"].routes.test}`, admin("test"));
    fastify.get(`${fastify.zoiaModulesConfig["test"].routes.test}/edit/:id`, admin("test.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["test"].routes.test}/edit/:id`, admin("test.edit"));
};
