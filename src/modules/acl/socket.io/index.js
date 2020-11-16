import ioAclLock from "./ioAclLock";
import ioAclRelease from "./ioAclRelease";

export default (fastify, event, data, socket) => {
    switch (event) {
    case "acl.lock":
        ioAclLock(fastify, data, socket);
        break;
    case "acl.release":
        ioAclRelease(fastify, data, socket);
        break;
    }
};
