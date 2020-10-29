import ioDataLock from "./ioDataLock";
import ioDataRelease from "./ioDataRelease";

export default (fastify, packet, socket) => {
    switch (packet[0]) {
    case "registry.lock":
        ioDataLock(fastify, packet[1], socket);
        break;
    case "registry.release":
        ioDataRelease(fastify, packet[1], socket);
        break;
    }
};
