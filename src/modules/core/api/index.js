import apiCaptcha from "./apiCaptcha";
import apiAlive from "./apiAlive";
import apiMFormImageUpload from "./apiMFormImageUpload.js";
import apiRestart from "./apiRestart";
import apiMaintenance from "./apiMaintenance";
import apiRebuild from "./apiRebuild";
import apiRebuildRestart from "./apiRebuildRestart";
import apiRebuildStatus from "./apiRebuildStatus";
import apiUpdate from "./apiUpdate";
import apiFiltersSave from "./apiFiltersSave";

export default fastify => {
    fastify.post("/api/core/captcha", apiCaptcha());
    fastify.get("/api/core/alive", apiAlive());
    fastify.post("/api/core/mform/image/upload", apiMFormImageUpload());
    fastify.post("/api/core/restart", apiRestart());
    fastify.post("/api/core/maintenance", apiMaintenance());
    fastify.post("/api/core/rebuild/start", apiRebuild());
    fastify.post("/api/core/rebuild/restart", apiRebuildRestart());
    fastify.post("/api/core/rebuild/status", apiRebuildStatus());
    fastify.post("/api/core/update/start", apiUpdate());
    fastify.post("/api/core/update/restart", apiRebuildRestart());
    fastify.post("/api/core/update/status", apiRebuildStatus());
    fastify.post("/api/core/filters/save", apiFiltersSave());
};
