import apiCaptcha from "./apiCaptcha";
import apiAlive from "./apiAlive";

export default fastify => {
    fastify.post("/api/core/captcha", apiCaptcha());
    fastify.get("/api/core/alive", apiAlive());
};
