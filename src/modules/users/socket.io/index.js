import ioUsersAuth from "./ioUsersAuth";
import ioUsersLock from "./ioUsersLock";
import ioUsersRelease from "./ioUsersRelease";

export default (fastify, packet, socket) => {
    switch (packet[0]) {
    case "users.lock":
        ioUsersLock(fastify, packet[1], socket);
        break;
    case "users.release":
        ioUsersRelease(fastify, packet[1], socket);
        break;
    case "users.auth":
        ioUsersAuth(fastify, packet[1], socket);
        break;
    }
};
