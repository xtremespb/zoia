import users from "./users";
import acl from "./acl";
import login from "./login";
import logout from "./logout";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig["users"].routes.users, users("users"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.users}`, users("users"));
    fastify.get(`${fastify.zoiaModulesConfig["users"].routes.users}/edit/:id`, users("users.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.users}/edit/:id`, users("users.edit"));
    fastify.get(fastify.zoiaConfig.routes.login, login());
    fastify.get(`/:language${fastify.zoiaConfig.routes.login}`, login());
    fastify.get(fastify.zoiaModulesConfig["users"].routes.logout, logout());
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.logout}`, logout());
    fastify.get(fastify.zoiaModulesConfig["users"].routes.acl, acl("acl"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.acl}`, acl("acl"));
    fastify.get(`${fastify.zoiaModulesConfig["users"].routes.acl}/edit/:id`, acl("acl.edit"));
    fastify.get(`/:language${fastify.zoiaModulesConfig["users"].routes.acl}/edit/:id`, acl("acl.edit"));
};
