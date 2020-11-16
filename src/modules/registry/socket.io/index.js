import ioDataLock from "./ioDataLock";
import ioDataRelease from "./ioDataRelease";

export default (fastify, event, data, socket) => {
    switch (event) {
    case "registry.lock":
        ioDataLock(fastify, data, socket);
        break;
    case "registry.release":
        ioDataRelease(fastify, data, socket);
        break;
    }
};
