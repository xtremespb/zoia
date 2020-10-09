module.exports = (fastify, data, socket) => {
    try {
        if (data && data.token) {
            const decoded = fastify.jwt.verify(data.token);
            socket.userId = decoded.id;
        }
    } catch (e) {
        fastify.log.error(e);
    }
};
