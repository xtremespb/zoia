import apiList from "./apiList";
import apiSave from "./apiSave";
import apiLoad from "./apiLoad";
import apiDelete from "./apiDelete";
import moduleConfig from "../module.json";

export default fastify => {
    fastify.post(`/api/${moduleConfig.id}/list`, apiList());
    fastify.post(`/api/${moduleConfig.id}/edit/save`, apiSave());
    fastify.post(`/api/${moduleConfig.id}/edit/load`, apiLoad());
    fastify.post(`/api/${moduleConfig.id}/edit/delete`, apiDelete());
};
