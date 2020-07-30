import apiList from "./apiList";
import apiTree from "./apiTree";
import apiDelete from "./apiDelete";
import apiPaste from "./apiPaste";
import apiUpload from "./apiUpload";
import apiRename from "./apiRename";
import apiNew from "./apiNew";

export default fastify => {
    fastify.post("/api/files/list", apiList());
    fastify.post("/api/files/tree", apiTree());
    fastify.post("/api/files/delete", apiDelete());
    fastify.post("/api/files/paste", apiPaste());
    fastify.post("/api/files/upload", apiUpload());
    fastify.post("/api/files/rename", apiRename());
    fastify.post("/api/files/new", apiNew());
};
