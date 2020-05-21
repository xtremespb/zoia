import admin from "./admin";
import login from "./login";
import logout from "./logout";

export default fastify => {
    fastify.get("/admin/users", admin(fastify, "users"));
    fastify.get("/admin/users/edit/:id", admin(fastify, "users.edit"));
    fastify.get("/:language/admin/users", admin(fastify, "users"));
    fastify.get("/:language/admin/users/edit/:id", admin(fastify, "users.edit"));
    fastify.get("/users/login", login(fastify));
    fastify.get("/:language/users/login", login(fastify));
    fastify.get("/users/logout", logout(fastify));
    fastify.get("/:language/users/logout", logout(fastify));
};
