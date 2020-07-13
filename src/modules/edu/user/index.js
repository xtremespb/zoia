import programs from './programs';
import modules from './modules';
import moduleView from './moduleView';
import test from './test';

export default fastify => { // fastify
    // Programs
    fastify.get('/edu', programs(fastify));
    fastify.get('/:language/edu', programs(fastify));
    // Program modules
    fastify.get('/edu/:program', modules(fastify));
    fastify.get('/:language/edu/:program', modules(fastify));
    // Module
    fastify.get('/edu/:program/module/:module', moduleView(fastify));
    fastify.get('/:language/edu/:program/module/:module', moduleView(fastify));
    // Module test
    fastify.get('/edu/:program/test/:module', test(fastify));
    fastify.get('/:language/edu/:program/test/:module', test(fastify));
};
