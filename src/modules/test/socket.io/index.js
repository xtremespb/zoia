import ioTestLock from "./ioTestLock";
import ioTestRelease from "./ioTestRelease";

export default (fastify, event, data, socket) => {
    switch (event) {
    case "test.lock":
        ioTestLock(fastify, data, socket);
        break;
    case "test.release":
        ioTestRelease(fastify, data, socket);
        break;
    }
};
