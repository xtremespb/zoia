import ioUsersAuth from "./ioUsersAuth";
import ioUsersLock from "./ioUsersLock";
import ioUsersRelease from "./ioUsersRelease";

export default (fastify, event, data, socket) => {
    switch (event) {
    case "users.lock":
        ioUsersLock(fastify, data, socket);
        break;
    case "users.release":
        ioUsersRelease(fastify, data, socket);
        break;
    case "users.auth":
        ioUsersAuth(fastify, data, socket);
        break;
    }
};
