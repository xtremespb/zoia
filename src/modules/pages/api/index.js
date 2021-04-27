import apiPagesList from "./apiPagesList";
import apiPageSave from "./apiPageSave";
import apiPageLoad from "./apiPageLoad";
import apiPageDelete from "./apiPageDelete";
import apiTreeLoad from "./apiTreeLoad";
import apiTreeSave from "./apiTreeSave";
import apiImagesList from "./apiImagesList";
import apiImagesUpload from "./apiImagesUpload";
import apiImagesRename from "./apiImagesRename";
import apiImagesDelete from "./apiImagesDelete";
import apiImagesPaste from "./apiImagesPaste";
import apiImagesNewDir from "./apiImagesNewDir";

export default fastify => {
    fastify.post("/api/pages/list", apiPagesList());
    fastify.post("/api/pages/edit/save", apiPageSave());
    fastify.post("/api/pages/edit/load", apiPageLoad());
    fastify.post("/api/pages/edit/delete", apiPageDelete());
    fastify.post("/api/pages/tree/load", apiTreeLoad());
    fastify.post("/api/pages/tree/save", apiTreeSave());
    fastify.post("/api/core/images/list", apiImagesList());
    fastify.post("/api/core/images/upload", apiImagesUpload());
    fastify.post("/api/core/images/rename", apiImagesRename());
    fastify.post("/api/core/images/delete", apiImagesDelete());
    fastify.post("/api/core/images/paste", apiImagesPaste());
    fastify.post("/api/core/images/newDir", apiImagesNewDir());
};
