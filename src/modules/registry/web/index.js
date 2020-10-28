import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["registry"].routes.admin, admin("data"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["registry"].routes.admin}`, admin("data"));
    fastify.get(`${fastify.zoiaModulesConfig["registry"].routes.admin}/edit/:id`, admin("data.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["registry"].routes.admin}/edit/:id`, admin("data.edit"));
};
