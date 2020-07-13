import apiPageView from './apiPageView';
import apiPageFind from './apiPageFind';
import apiPageLoad from './apiPageLoad';
import apiPageSave from './apiPageSave';
import apiPagesDelete from './apiPagesDelete';
import apiPagesList from './apiPagesList';
import apiLoadFolderTree from './apiLoadFolderTree';
import apiSaveFolderTree from './apiSaveFolderTree';
import apiUploadImage from './apiUploadImage';

export default fastify => {
    fastify.post('/api/page/find', apiPageFind(fastify));
    fastify.post('/api/page/view', apiPageView(fastify));
    fastify.post('/api/pages/list', apiPagesList(fastify));
    fastify.post('/api/pages/load', apiPageLoad(fastify));
    fastify.post('/api/pages/save', apiPageSave(fastify));
    fastify.post('/api/pages/delete', apiPagesDelete(fastify));
    fastify.post('/api/pages/folders/load', apiLoadFolderTree(fastify));
    fastify.post('/api/pages/folders/save', apiSaveFolderTree(fastify));
    fastify.post('/api/pages/image/upload', apiUploadImage(fastify));
};
