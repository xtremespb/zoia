import admin from "./admin";
import pageView from "./pageView";
import images from "./images";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.pages, admin("pages"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.pages}`, admin("pages"));
    fastify.get(`${fastify.zoiaModulesConfig["pages"].routes.pages}/edit/:id`, admin("pages.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.pages}/edit/:id`, admin("pages.edit"));
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.view, pageView());
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.view}`, pageView());
    fastify.get(fastify.zoiaConfig.routes.imagesBrowser, images());
    fastify.get(`/:language${fastify.zoiaConfig.routes.imagesBrowser}`, images());
};
