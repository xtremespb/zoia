import apiLogin from "./apiLogin";
import apiUsersList from "./apiUsersList";

export default fastify => {
    fastify.post("/api/users/login", apiLogin(fastify));
    fastify.post("/api/users/list", apiUsersList(fastify));
};
