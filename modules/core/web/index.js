import download from "./download";

export default fastify => {
    fastify.get(fastify.zoiaConfig.downloadRoute, download(fastify));
    fastify.get(`/:language${fastify.zoiaConfig.downloadRoute}`, download(fastify));
};
