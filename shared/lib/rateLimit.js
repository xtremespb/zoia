import xxhash from "xxhashjs";
import fastifyPlugin from "fastify-plugin";
import {
    Long
} from "mongodb";

const buildRate = async (fastify, settings, routeOptions) => {
    const preHandler = async (req, rep, next) => {
        console.log(`Pre-handler is called`);
        const hash = xxhash.h64(`${req.ip}${req.urlData().path}`, fastify.zoiaConfig.secretInt).toString(16);
        const data = (await fastify.mongo.db.collection("rateLimit").findOne({
            _id: hash
        })) || {
            createdAt: new Date(),
            updatedAt: new Date(),
            max: 0
        };
        data.max += 1;
        const timestampNow = new Date().getTime();
        const timestampUpdated = data.updatedAt.getTime();
        if (timestampNow - timestampUpdated <= routeOptions.config.rateLimit.timeWindow && data.max >= routeOptions.config.rateLimit.max) {
            // Limit reached
            console.log("L I M I T");
            await fastify.mongo.db.collection("rateLimit").updateOne({
                _id: hash
            }, {
                $set: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    max: routeOptions.config.rateLimit.max
                }
            }, {
                upsert: true
            });
            next();
            return rep.code(204);
        }
        if (timestampNow - timestampUpdated > routeOptions.config.rateLimit.timeWindow) {
            data.max = 0;
        }
        await fastify.mongo.db.collection("rateLimit").updateOne({
            _id: hash
        }, {
            $set: {
                createdAt: data.createdAt,
                updatedAt: new Date(),
                max: data.max
            }
        }, {
            upsert: true
        });
        next();
        return rep.code(204);
    };
    // Add pre-handler to the route
    if (Array.isArray(routeOptions.preHandler)) {
        routeOptions.preHandler.push(preHandler);
    } else if (typeof routeOptions.preHandler === "function") {
        routeOptions.preHandler = [routeOptions.preHandler, preHandler];
    } else {
        routeOptions.preHandler = [preHandler];
    }
};

const rateLimitPlugin = (fastify, settings, next) => {
    fastify.addHook("onRoute", async routeOptions => {
        if (routeOptions.config && routeOptions.config.rateLimit) {
            await buildRate(fastify, settings, routeOptions);
        }
    });
    next();
};

export default fastifyPlugin(rateLimitPlugin, {
    fastify: ">=2.x",
    name: "zoia-rate-limit"
});
