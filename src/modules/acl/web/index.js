import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["acl"].routes.admin, admin("acl"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["acl"].routes.admin}`, admin("acl"));
    fastify.get(`${fastify.zoiaModulesConfig["acl"].routes.admin}/edit/:id`, admin("acl.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["acl"].routes.admin}/edit/:id`, admin("acl.edit"));
};
