import apiList from "./apiList";
import apiTree from "./apiTree";
import apiDelete from "./apiDelete";
import apiPaste from "./apiPaste";

export default fastify => {
    fastify.post("/api/files/list", apiList());
    fastify.post("/api/files/tree", apiTree());
    fastify.post("/api/files/delete", apiDelete());
    fastify.post("/api/files/paste", apiPaste());
};
