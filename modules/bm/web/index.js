import search from "./search";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["bm"].routes.search, search(fastify));
    fastify.get(`/:language${fastify.zoiaModulesConfig["bm"].routes.search}`, search(fastify));
};
