import Auth from "../../../shared/lib/auth";

export default async (fastify, data, socket) => {
    try {
        if (data && data.token && data.id && fastify.redis) {
            const auth = new Auth(fastify.mongo.db, fastify, null, null, data.token);
            const user = await auth.getUserData();
            if (!user || !auth.checkStatus("admin")) {
                return;
            }
            const lockData = await fastify.redis.get(`${fastify.zoiaConfig.siteOptions.id}_users_lock_${data.id}`);
            if (lockData && lockData === String(user._id)) {
                await fastify.redis.del(`${fastify.zoiaConfig.siteOptions.id}_users_lock_${data.id}`);
                socket.lockData = null;
            }
        }
    } catch (e) {
        fastify.log.error(e);
    }
};
