import pageView from './pageView';

export default fastify => { // fastify
    fastify.get('/*', pageView(fastify));
};
