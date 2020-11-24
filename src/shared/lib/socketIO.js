import Redis from "ioredis";
import {
    Server
} from "socket.io";
import redisAdapter from "socket.io-redis";

export default class {
    constructor(fastify) {
        this.io = new Server(fastify.server, fastify.zoiaConfig.socketIO || {});
        if (fastify.zoiaConfig.redis.enabled) {
            this.io.adapter(redisAdapter({
                key: `${fastify.zoiaConfig.siteId}.socket.io`,
                pubClient: new Redis(fastify.zoiaConfig.redis),
                subClient: new Redis(fastify.zoiaConfig.redis)
            }));
        }
        fastify.decorate("io", this.io);
        fastify.decorateRequest("io", this.io);
        this.io.on("connection", socket => {
            // Deprecated: migration to Socket.IO v3
            // this.io.use((packet, next) => {
            //     fastify.socketIoModules.map(f => f(fastify, packet, socket));
            //     next();
            // });
            socket.on("disconnect", async () => {
                if (fastify.zoiaConfig.redis.enabled && socket.lockData) {
                    await fastify.redis.del(`${fastify.zoiaConfig.siteId}_${socket.lockData.module}_lock_${socket.lockData.id}`);
                }
            });
            socket.onAny((event, ...args) => {
                fastify.socketIoModules.map(f => f(fastify, event, args[0], socket));
            });
        });
    }

    setEvents() {
        // TODO: Set event handlers
    }
}
