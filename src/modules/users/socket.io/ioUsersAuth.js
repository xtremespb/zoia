import Auth from "../../../shared/lib/auth";

export default async (fastify, data, socket) => {
    try {
        if (data && data.token) {
            const auth = new Auth(fastify.mongo.db, fastify, null, null, data.token);
            const user = await auth.getUserData();
            if (!user || !auth.statusActive()) {
                return;
            }
            socket.userId = String(user._id);
        }
    } catch (e) {
        fastify.log.error(e);
    }
};
