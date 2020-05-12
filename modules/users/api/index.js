import apiLogin from "./apiLogin";
import apiUsersList from "./apiUsersList";
import apiUserSave from "./apiUserSave";

export default fastify => {
    fastify.post("/api/users/login", apiLogin(fastify));
    fastify.post("/api/users/list", apiUsersList(fastify));
    fastify.post("/api/users/edit/save", apiUserSave(fastify));
};
