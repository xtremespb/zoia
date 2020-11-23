import admin from "./admin";
import pageView from "./pageView";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.pages, admin("pages"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.pages}`, admin("pages"));
    fastify.get(`${fastify.zoiaModulesConfig["pages"].routes.pages}/edit/:id`, admin("pages.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.pages}/edit/:id`, admin("pages.edit"));
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.view, pageView());
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.view}`, pageView());
};
