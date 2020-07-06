import admin from "./admin";
import pageView from "./pageView";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.admin, admin("pages"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.admin}`, admin("pages"));
    fastify.get(`${fastify.zoiaModulesConfig["pages"].routes.admin}/edit/:id`, admin("pages.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.admin}/edit/:id`, admin("pages.edit"));
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.view, pageView());
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.view}`, pageView());
};
