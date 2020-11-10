import ioTestLock from "./ioTestLock";
import ioTestRelease from "./ioTestRelease";

export default (fastify, packet, socket) => {
    switch (packet[0]) {
    case "test.lock":
        ioTestLock(fastify, packet[1], socket);
        break;
    case "test.release":
        ioTestRelease(fastify, packet[1], socket);
        break;
    }
};
