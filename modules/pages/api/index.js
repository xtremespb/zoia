import apiPagesList from "./apiPagesList";

export default fastify => {
    fastify.post("/api/pages/list", apiPagesList(fastify));
};
