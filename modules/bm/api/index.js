import apiSearch from "./apiSearch";
import apiBases from "./apiBases";
import apiPrice from "./apiPrice";
import apiRequest from "./apiRequest";

export default fastify => {
    fastify.post("/api/bm/search", apiSearch(fastify));
    fastify.post("/api/bm/bases", apiBases(fastify));
    fastify.post("/api/bm/price", apiPrice(fastify));
    fastify.post("/api/bm/request", apiRequest(fastify));
};
