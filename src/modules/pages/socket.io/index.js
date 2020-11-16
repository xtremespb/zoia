import ioPagesLock from "./ioPagesLock";
import ioPagesRelease from "./ioPagesRelease";

export default (fastify, event, data, socket) => {
    switch (event) {
    case "pages.lock":
        ioPagesLock(fastify, data, socket);
        break;
    case "pages.release":
        ioPagesRelease(fastify, data, socket);
        break;
    }
};
