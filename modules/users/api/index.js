import apiLogin from "./apiLogin";
import apiUsersList from "./apiUsersList";
import apiTest from "./apiTest";

export default fastify => {
    fastify.post("/api/users/login", apiLogin(fastify));
    fastify.post("/api/users/list", apiUsersList(fastify));
    fastify.post("/api/users/test", apiTest(fastify));
};
