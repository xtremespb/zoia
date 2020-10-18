import apiConfigSave from "./apiConfigSave";
import apiConfigLoad from "./apiConfigLoad";
import apiGenerate from "./apiGenerate";
import apiFilesList from "./apiFilesList";
import apiFilesDelete from "./apiFilesDelete";

export default fastify => {
    fastify.post("/api/cm/config/save", apiConfigSave());
    fastify.post("/api/cm/config/load", apiConfigLoad());
    fastify.post("/api/cm/card/generate", apiGenerate());
    fastify.post("/api/cm/files/list", apiFilesList());
    fastify.post("/api/cm/files/delete", apiFilesDelete());
};
