import apiList from "./apiList";

export default fastify => {
    fastify.post("/api/files/list", apiList());
};
