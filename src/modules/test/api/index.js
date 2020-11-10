import apiTestList from "./apiTestList";
import apiTestSave from "./apiTestSave";
import apiTestLoad from "./apiTestLoad";
import apiTestDelete from "./apiTestDelete";
import apiTreeLoad from "./apiTreeLoad";
import apiTreeSave from "./apiTreeSave";

export default fastify => {
    fastify.post("/api/test/list", apiTestList());
    fastify.post("/api/test/edit/save", apiTestSave());
    fastify.post("/api/test/edit/load", apiTestLoad());
    fastify.post("/api/test/edit/delete", apiTestDelete());
    fastify.post("/api/test/tree/load", apiTreeLoad());
    fastify.post("/api/test/tree/save", apiTreeSave());
};
