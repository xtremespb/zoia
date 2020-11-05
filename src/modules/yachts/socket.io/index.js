import ioYachtsLock from "./ioYachtsLock";
import ioYachtsRelease from "./ioYachtsRelease";

export default (fastify, packet, socket) => {
    switch (packet[0]) {
    case "yachts.lock":
        ioYachtsLock(fastify, packet[1], socket);
        break;
    case "yachts.release":
        ioYachtsRelease(fastify, packet[1], socket);
        break;
    }
};
