import apiRebuild from "./apiRebuild";
import apiRestart from "./apiRestart";
import apiStatus from "./apiStatus";

export default fastify => {
    fastify.post("/api/update/rebuild", apiRebuild());
    fastify.post("/api/update/restart", apiRestart());
    fastify.post("/api/update/status", apiStatus());
};
