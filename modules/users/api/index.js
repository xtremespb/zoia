import apiLogin from "./apiLogin";
import apiUsersList from "./apiUsersList";
import apiUserSave from "./apiUserSave";
import apiUserLoad from "./apiUserLoad";
import apiUserDelete from "./apiUserDelete";

export default fastify => {
    fastify.post("/api/users/login", apiLogin(fastify));
    fastify.post("/api/users/list", apiUsersList(fastify));
    fastify.post("/api/users/edit/save", apiUserSave(fastify));
    fastify.post("/api/users/edit/load", apiUserLoad(fastify));
    fastify.post("/api/users/edit/delete", apiUserDelete(fastify));
};
