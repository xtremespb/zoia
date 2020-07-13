import apiVersionData from './apiVersionData';

export default fastify => {
    fastify.post('/api/update/version', apiVersionData(fastify));
};
