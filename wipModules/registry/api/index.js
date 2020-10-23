import apiDataList from "./apiDataList";
import apiDataSave from "./apiDataSave";
import apiDataLoad from "./apiDataLoad";
import apiDataDelete from "./apiDataDelete";

export default fastify => {
    fastify.post("/api/registry/list", apiDataList());
    fastify.post("/api/registry/edit/save", apiDataSave());
    fastify.post("/api/registry/edit/load", apiDataLoad());
    fastify.post("/api/registry/edit/delete", apiDataDelete());
};
