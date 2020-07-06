import admin from "./admin";
import login from "./login";
import logout from "./logout";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["users"].routes.admin, admin("users"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.admin}`, admin("users"));
    fastify.get(`${fastify.zoiaModulesConfig["users"].routes.admin}/edit/:id`, admin("users.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.admin}/edit/:id`, admin("users.edit"));
    fastify.get(fastify.zoiaConfig.routes.login, login());
    fastify.get(`/:language${fastify.zoiaConfig.routes.login}`, login());
    fastify.get(fastify.zoiaModulesConfig["users"].routes.logout, logout());
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.logout}`, logout());
};
