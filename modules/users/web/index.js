import admin from "./admin";
import login from "./login";
import logout from "./logout";
// eslint-disable-next-line import/no-unresolved
import moduleConfig from "../config.json";

export default fastify => {
    fastify.get(moduleConfig.routes.admin, admin(fastify, "users"));
    fastify.get(`/:language${moduleConfig.routes.admin}`, admin(fastify, "users"));
    fastify.get(`${moduleConfig.routes.admin}/edit/:id`, admin(fastify, "users.edit"));
    fastify.get(`/:language${moduleConfig.routes.admin}/edit/:id`, admin(fastify, "users.edit"));
    fastify.get(moduleConfig.routes.login, login(fastify));
    fastify.get(`/:language${moduleConfig.routes.login}`, login(fastify));
    fastify.get(moduleConfig.routes.logout, logout(fastify));
    fastify.get(`/:language${moduleConfig.routes.logout}`, logout(fastify));
};
