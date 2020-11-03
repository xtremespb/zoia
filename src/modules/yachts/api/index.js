import apiYachtsList from "./apiYachtsList";
import apiYachtSave from "./apiYachtSave";
import apiYachtLoad from "./apiYachtLoad";
import apiYachtDelete from "./apiYachtDelete";
import apiTreeLoad from "./apiTreeLoad";
import apiTreeSave from "./apiTreeSave";

export default fastify => {
    fastify.post("/api/yachts/list", apiYachtsList());
    fastify.post("/api/yachts/edit/save", apiYachtSave());
    fastify.post("/api/yachts/edit/load", apiYachtLoad());
    fastify.post("/api/yachts/edit/delete", apiYachtDelete());
    fastify.post("/api/yachts/tree/load", apiTreeLoad());
    fastify.post("/api/yachts/tree/save", apiTreeSave());
};
