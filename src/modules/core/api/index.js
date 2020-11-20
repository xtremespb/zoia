import apiCaptcha from "./apiCaptcha";
import apiAlive from "./apiAlive";
import apiImagesList from "./apiImagesList";
import apiImagesUpload from "./apiImagesUpload";
import apiImagesRename from "./apiImagesRename";
import apiImagesDelete from "./apiImagesDelete";
import apiImagesPaste from "./apiImagesPaste";
import apiImagesNewDir from "./apiImagesNewDir";
import apiMFormImageUpload from "./apiMFormImageUpload.js";
import apiRestart from "./apiRestart";
import apiMaintenance from "./apiMaintenance";

export default fastify => {
    fastify.post("/api/core/captcha", apiCaptcha());
    fastify.get("/api/core/alive", apiAlive());
    fastify.post("/api/core/images/list", apiImagesList());
    fastify.post("/api/core/images/upload", apiImagesUpload());
    fastify.post("/api/core/images/rename", apiImagesRename());
    fastify.post("/api/core/images/delete", apiImagesDelete());
    fastify.post("/api/core/images/paste", apiImagesPaste());
    fastify.post("/api/core/images/newDir", apiImagesNewDir());
    fastify.post("/api/core/mform/image/upload", apiMFormImageUpload());
    fastify.post("/api/core/restart", apiRestart());
    fastify.post("/api/core/maintenance", apiMaintenance());
};
