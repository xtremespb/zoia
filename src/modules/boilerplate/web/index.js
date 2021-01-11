import admin from "./admin";
import moduleConfig from "../module.json";

export default fastify => {
    fastify.get(fastify.zoiaModulesConfig[moduleConfig.id].routes[moduleConfig.id], admin(moduleConfig.id));
    fastify.get(`/:language${fastify.zoiaModulesConfig[moduleConfig.id].routes[moduleConfig.id]}`, admin(moduleConfig.id));
    fastify.get(`${fastify.zoiaModulesConfig[moduleConfig.id].routes[moduleConfig.id]}/edit/:id`, admin(`${moduleConfig.id}.edit`));
    fastify.get(`/:language${fastify.zoiaModulesConfig[moduleConfig.id].routes[moduleConfig.id]}/edit/:id`, admin(`${moduleConfig.id}.edit`));
};
