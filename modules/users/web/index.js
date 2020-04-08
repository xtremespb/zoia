import test from "./admin";

export default fastify => {
    fastify.get("/admin/users", test(fastify));
};
