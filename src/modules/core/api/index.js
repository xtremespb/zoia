import apiCaptcha from "./apiCaptcha";
import apiAlive from "./apiAlive";
import apiImagesList from "./apiImagesList";
import apiImagesUpload from "./apiImagesUpload";
import apiImagesRename from "./apiImagesRename";

export default fastify => {
    fastify.post("/api/core/captcha", apiCaptcha());
    fastify.get("/api/core/alive", apiAlive());
    fastify.post("/api/core/images/list", apiImagesList());
    fastify.post("/api/core/images/upload", apiImagesUpload());
    fastify.post("/api/core/images/rename", apiImagesRename());
};
