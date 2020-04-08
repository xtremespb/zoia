import apiLogin from "./apiLogin";

export default fastify => {
    fastify.post("/api/users/login", apiLogin(fastify));
};
