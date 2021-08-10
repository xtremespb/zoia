import apiDataList from "./apiDataList";
import apiDataSave from "./apiDataSave";
import apiDataLoad from "./apiDataLoad";
import apiDataDelete from "./apiDataDelete";
import apiRecycledDelete from "./apiRecycledDelete";
import apiRecycledList from "./apiRecycledList";
import apiRecycledRestore from "./apiRecycledRestore";

import moduleConfig from "../module.json";

export default fastify => {
    fastify.post(`/api/${moduleConfig.id}/list`, apiDataList());
    fastify.post(`/api/${moduleConfig.id}/edit/save`, apiDataSave());
    fastify.post(`/api/${moduleConfig.id}/edit/load`, apiDataLoad());
    fastify.post(`/api/${moduleConfig.id}/edit/delete`, apiDataDelete());
    fastify.post(`/api/${moduleConfig.id}/list/recycled`, apiRecycledList());
    fastify.post(`/api/${moduleConfig.id}/edit/delete/restore`, apiRecycledRestore());
    fastify.post(`/api/${moduleConfig.id}/edit/delete/recycled`, apiRecycledDelete());
};
