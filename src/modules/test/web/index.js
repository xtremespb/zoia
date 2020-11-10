import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["test"].routes.admin, admin("test"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["test"].routes.admin}`, admin("test"));
    fastify.get(`${fastify.zoiaModulesConfig["test"].routes.admin}/edit/:id`, admin("test.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["test"].routes.admin}/edit/:id`, admin("test.edit"));
};
