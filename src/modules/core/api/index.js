import apiCaptcha from "./apiCaptcha";
import apiAlive from "./apiAlive";
import apiImagesList from "./apiImagesList";

export default fastify => {
    fastify.post("/api/core/captcha", apiCaptcha());
    fastify.get("/api/core/alive", apiAlive());
    fastify.post("/api/core/images/list", apiImagesList());
};
