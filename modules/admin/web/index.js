import admin from "./admin";

export default fastify => {
    fastify.get("/admin", admin(fastify));
    fastify.get("/:language/admin", admin(fastify));
};
