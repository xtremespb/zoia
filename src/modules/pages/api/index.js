import apiPagesList from "./apiPagesList";
import apiPageSave from "./apiPageSave";
import apiPageSavePME from "./apiPageSavePME";
import apiPageLoad from "./apiPageLoad";
import apiPageLoadPME from "./apiPageLoadPME";
import apiPageDelete from "./apiPageDelete";
import apiTreeLoad from "./apiTreeLoad";
import apiTreeSave from "./apiTreeSave";
import apiImagesList from "./apiImagesList";
import apiImagesUpload from "./apiImagesUpload";
import apiImagesRename from "./apiImagesRename";
import apiImagesDelete from "./apiImagesDelete";
import apiImagesPaste from "./apiImagesPaste";
import apiImagesNewDir from "./apiImagesNewDir";
import apiRecycledDelete from "./apiRecycledDelete";
import apiRecycledList from "./apiRecycledList";
import apiRecycledRestore from "./apiRecycledRestore";

import moduleConfig from "../module.json";

export default fastify => {
    fastify.post(`/api/${moduleConfig.id}/list`, apiPagesList());
    fastify.post(`/api/${moduleConfig.id}/edit/save`, apiPageSave());
    fastify.post(`/api/${moduleConfig.id}/edit/pm/save`, apiPageSavePME());
    fastify.post(`/api/${moduleConfig.id}/edit/load`, apiPageLoad());
    fastify.post(`/api/${moduleConfig.id}/edit/pm/load`, apiPageLoadPME());
    fastify.post(`/api/${moduleConfig.id}/edit/delete`, apiPageDelete());
    fastify.post(`/api/${moduleConfig.id}/tree/load`, apiTreeLoad());
    fastify.post(`/api/${moduleConfig.id}/tree/save`, apiTreeSave());
    fastify.post(`/api/${moduleConfig.id}/list/recycled`, apiRecycledList());
    fastify.post(`/api/${moduleConfig.id}/edit/delete/restore`, apiRecycledRestore());
    fastify.post(`/api/${moduleConfig.id}/edit/delete/recycled`, apiRecycledDelete());
    fastify.post(`/api/core/images/list`, apiImagesList());
    fastify.post(`/api/core/images/upload`, apiImagesUpload());
    fastify.post(`/api/core/images/rename`, apiImagesRename());
    fastify.post(`/api/core/images/delete`, apiImagesDelete());
    fastify.post(`/api/core/images/paste`, apiImagesPaste());
    fastify.post(`/api/core/images/newDir`, apiImagesNewDir());
};
