import ioAclLock from "./ioAclLock";
import ioAclRelease from "./ioAclRelease";

export default (fastify, packet, socket) => {
    switch (packet[0]) {
    case "acl.lock":
        ioAclLock(fastify, packet[1], socket);
        break;
    case "acl.release":
        ioAclRelease(fastify, packet[1], socket);
        break;
    }
};
