import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["yachts"].routes.admin, admin("yachts"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["yachts"].routes.admin}`, admin("yachts"));
    fastify.get(`${fastify.zoiaModulesConfig["yachts"].routes.admin}/edit/:id`, admin("yachts.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["yachts"].routes.admin}/edit/:id`, admin("yachts.edit"));
};
