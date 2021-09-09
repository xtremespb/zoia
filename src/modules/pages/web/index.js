import admin from "./admin";
import pageView from "./pageView";
import images from "./images";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.pages, admin("pages"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.pages}`, admin("pages"));
    fastify.get(`${fastify.zoiaModulesConfig["pages"].routes.pages}/edit/:id`, admin("pages.editRaw"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.pages}/edit/:id`, admin("pages.editRaw"));
    fastify.get(fastify.zoiaModulesConfig["pages"].routes.view, pageView());
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.view}`, pageView());
    fastify.get(fastify.zoiaConfig.routes.imagesBrowser, images());
    fastify.get(`/:language${fastify.zoiaConfig.routes.imagesBrowser}`, images());
    fastify.get(`${fastify.zoiaModulesConfig["pages"].routes.pages}/pm/edit/:id`, admin("pages.editPM"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["pages"].routes.pages}/pm/edit/:id`, admin("pages.editPM"));
};
