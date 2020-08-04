import apiCaptcha from "./apiCaptcha";
import apiAlive from "./apiAlive";
import binDownload from "./binDownload";

export default fastify => {
    fastify.post("/api/core/captcha", apiCaptcha());
    fastify.get("/api/core/alive", apiAlive());
    fastify.get("/zoia/core/download", binDownload());
};
