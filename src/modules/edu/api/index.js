import testExecute from './testExecute';
import testRequest from './testRequest';
import status from './status';
import data from './data';

export default fastify => {
    fastify.post('/api/edu/test/execute', testExecute(fastify));
    fastify.all('/api/edu/data', data(fastify));
    fastify.post('/api/edu/test/request', testRequest(fastify));
    fastify.post('/api/edu/status', status(fastify));
};
