import apiConfigSave from "./apiConfigSave";
import apiConfigLoad from "./apiConfigLoad";

export default fastify => {
    fastify.post("/api/cm/config/save", apiConfigSave());
    fastify.post("/api/cm/config/load", apiConfigLoad());
};
