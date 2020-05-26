import apiSearch from "./apiSearch";
import apiBases from "./apiBases";

export default fastify => {
    fastify.post("/api/bm/search", apiSearch(fastify));
    fastify.post("/api/bm/bases", apiBases(fastify));
};
