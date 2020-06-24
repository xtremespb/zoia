import apiCaptcha from "./apiCaptcha";

export default fastify => {
    fastify.post("/api/core/captcha", apiCaptcha(fastify));
};
