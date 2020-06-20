import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.admin, admin(fastify, "pages"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.admin}`, admin(fastify, "pages"));
    fastify.get(`${fastify.zoiaModulesConfig["pages"].routes.admin}/edit/:id`, admin(fastify, "pages.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.admin}/edit/:id`, admin(fastify, "pages.edit"));
};
