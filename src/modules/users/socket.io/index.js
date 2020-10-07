import ioUsersAuth from "./ioUsersAuth";

export default (fastify, packet, socket) => {
    switch (packet[0]) {
    case "users.auth":
        ioUsersAuth(fastify, packet[1], socket);
        break;
    }
};
