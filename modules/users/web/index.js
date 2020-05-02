import admin from "./admin";
import test from "./test";

export default fastify => {
    fastify.get("/admin/users", admin(fastify, "users"));
    fastify.get("/admin/users/edit/:id", admin(fastify, "users.edit"));
    fastify.get("/:language/admin/users", admin(fastify, "users"));
    fastify.get("/:language/admin/users/edit/:id", admin(fastify, "users.edit"));
    fastify.get("/test", test(fastify, "users"));
};
