import apiList from "./apiList";
import apiSave from "./apiSave";
import apiLoad from "./apiLoad";
import apiDelete from "./apiDelete";
import apiRecycledDelete from "./apiRecycledDelete";
import apiRecycledList from "./apiRecycledList";
import apiRecycledRestore from "./apiRecycledRestore";

import moduleConfig from "../module.json";

export default fastify => {
    fastify.post(`/api/${moduleConfig.id}/list`, apiList());
    fastify.post(`/api/${moduleConfig.id}/edit/save`, apiSave());
    fastify.post(`/api/${moduleConfig.id}/edit/load`, apiLoad());
    fastify.post(`/api/${moduleConfig.id}/edit/delete`, apiDelete());
    fastify.post(`/api/${moduleConfig.id}/list/recycled`, apiRecycledList());
    fastify.post(`/api/${moduleConfig.id}/edit/delete/restore`, apiRecycledRestore());
    fastify.post(`/api/${moduleConfig.id}/edit/delete/recycled`, apiRecycledDelete());
};
