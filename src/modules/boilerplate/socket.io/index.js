import ioLock from "./ioLock";
import ioRelease from "./ioRelease";
import moduleConfig from "../module.json";

export default (fastify, event, data, socket) => {
    switch (event) {
    case `${moduleConfig.id}.lock`:
        ioLock(fastify, data, socket);
        break;
    case `${moduleConfig.id}.release`:
        ioRelease(fastify, data, socket);
        break;
    }
};
