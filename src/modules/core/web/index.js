import download from "./download";
import images from "./images";

export default fastify => {
    fastify.get(fastify.zoiaConfig.routes.download, download());
    fastify.get(`/:language${fastify.zoiaConfig.routes.download}`, download());
    fastify.get(fastify.zoiaConfig.routes.imagesBrowser, images());
    fastify.get(`/:language${fastify.zoiaConfig.routes.imagesBrowser}`, images());
};
