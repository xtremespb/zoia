import ioPagesLock from "./ioPagesLock";
import ioPagesRelease from "./ioPagesRelease";

export default (fastify, packet, socket) => {
    switch (packet[0]) {
    case "pages.lock":
        ioPagesLock(fastify, packet[1], socket);
        break;
    case "pages.release":
        ioPagesRelease(fastify, packet[1], socket);
        break;
    }
};
