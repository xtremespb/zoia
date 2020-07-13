import apiLoadFolderTree from './apiLoadFolderTree';
import apiSaveFolderTree from './apiSaveFolderTree';

export default fastify => {
    fastify.post('/api/nav/load', apiLoadFolderTree(fastify));
    fastify.post('/api/nav/save', apiSaveFolderTree(fastify));
};
