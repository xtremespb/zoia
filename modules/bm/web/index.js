import search from "./search";
import yacht from "./yacht";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["bm"].routes.search, search(fastify));
    fastify.get(`/:language${fastify.zoiaModulesConfig["bm"].routes.search}`, search(fastify));
    fastify.get(`${fastify.zoiaModulesConfig["bm"].routes.yacht}/:id`, yacht(fastify));
    fastify.get(`/:language${fastify.zoiaModulesConfig["bm"].routes.yacht}/:id`, yacht(fastify));
};
