import download from "./download";
import admin from "./admin";

export default fastify => {
    fastify.get(fastify.zoiaConfig.routes.download, download());
    fastify.get(`/:language${fastify.zoiaConfig.routes.download}`, download());
    fastify.get(fastify.zoiaModulesConfig["core"].routes.core, admin());
    fastify.get(`/:language${fastify.zoiaModulesConfig["core"].routes.core}`, admin());
};
