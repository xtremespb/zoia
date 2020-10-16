import apiConfigSave from "./apiConfigSave";
import apiConfigLoad from "./apiConfigLoad";
import apiGenerate from "./apiGenerate";

export default fastify => {
    fastify.post("/api/cm/config/save", apiConfigSave());
    fastify.post("/api/cm/config/load", apiConfigLoad());
    fastify.post("/api/cm/card/generate", apiGenerate());
};
