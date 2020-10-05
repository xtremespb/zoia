import apiTreeLoad from "./apiTreeLoad";
import apiTreeSave from "./apiTreeSave";

export default fastify => {
    fastify.post("/api/nav/tree/load", apiTreeLoad());
    fastify.post("/api/nav/tree/save", apiTreeSave());
};
