import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["registry"].routes.registry, admin("data"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["registry"].routes.registry}`, admin("data"));
    fastify.get(`${fastify.zoiaModulesConfig["registry"].routes.registry}/edit/:id`, admin("data.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["registry"].routes.registry}/edit/:id`, admin("data.edit"));
};
