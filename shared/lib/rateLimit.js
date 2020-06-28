import xxhash from "xxhashjs";
import fastifyPlugin from "fastify-plugin";

const getLimitData = async (fastify, settings, hashFull) => {
    const defaults = {
        createdAt: new Date(),
        updatedAt: new Date(),
        max: 0
    };
    if (settings.redis && fastify.redis) {
        const dataLimit = await fastify.redis.get(`${fastify.zoiaConfig.siteOptions.id}_rateLimit_${hashFull}`);
        const dataLimitObj = dataLimit ? JSON.parse(dataLimit) : defaults;
        dataLimitObj.updatedAt = typeof dataLimitObj.updatedAt === "string" ? new Date(dataLimitObj.updatedAt) : dataLimitObj.updatedAt;
        return dataLimitObj;
    }
    const dataLimit = (await fastify.mongo.db.collection("rateLimit").findOne({
        _id: hashFull
    })) || defaults;
    return dataLimit;
};

const getBanData = async (fastify, settings, hashIP) => {
    if (settings.redis && fastify.redis) {
        const dataBan = await fastify.redis.get(`${fastify.zoiaConfig.siteOptions.id}_rateBan_${hashIP}`);
        return dataBan ? JSON.parse(dataBan) : null;
    }
    const dataBan = await fastify.mongo.db.collection("rateBan").findOne({
        _id: hashIP
    });
    return dataBan;
};

const updateOnLimitExceeded = async (fastify, settings, hashFull, max) => {
    const data = {
        createdAt: new Date(),
        updatedAt: new Date(),
        max
    };
    if (settings.redis && fastify.redis) {
        await fastify.redis.set(`${fastify.zoiaConfig.siteOptions.id}_rateLimit_${hashFull}`, JSON.stringify(data), "ex", 3600);
    } else {
        await fastify.mongo.db.collection("rateLimit").updateOne({
            _id: hashFull
        }, {
            $set: data
        }, {
            upsert: true
        });
    }
};

const updateOnBan = async (fastify, settings, hashIP) => {
    const data = {
        createdAt: new Date(),
    };
    if (settings.redis && fastify.redis) {
        await fastify.redis.set(`${fastify.zoiaConfig.siteOptions.id}_rateBan_${hashIP}`, JSON.stringify(data), "ex", 86400);
    } else {
        await fastify.mongo.db.collection("rateBan").updateOne({
            _id: hashIP
        }, {
            $set: data
        }, {
            upsert: true
        });
    }
};

const updateDataLimit = async (fastify, settings, hashFull, createdAt, max) => {
    const data = {
        createdAt,
        updatedAt: new Date(),
        max
    };
    if (settings.redis && fastify.redis) {
        await fastify.redis.set(`${fastify.zoiaConfig.siteOptions.id}_rateLimit_${hashFull}`, JSON.stringify(data), "ex", 3600);
    } else {
        await fastify.mongo.db.collection("rateLimit").updateOne({
            _id: hashFull
        }, {
            $set: data
        }, {
            upsert: true
        });
    }
};

const buildRate = async (fastify, settings, routeOptions) => {
    const preHandler = async (req, rep, next) => {
        const hashFull = xxhash.h64(`${req.ip}${req.urlData().path}`, fastify.zoiaConfig.secretInt).toString(16);
        const hashIP = xxhash.h64(req.ip, fastify.zoiaConfig.secretInt).toString(16);
        if (settings.ban) {
            const dataBan = await getBanData(fastify, settings, hashIP);
            if (dataBan) {
                rep.sendError(rep, "Forbidden", 403);
                return rep.getCode204(rep);
            }
        }
        const dataLimit = await getLimitData(fastify, settings, hashFull);
        dataLimit.max += 1;
        const timestampNow = new Date().getTime();
        const timestampUpdated = dataLimit.updatedAt.getTime();
        if (timestampNow - timestampUpdated <= routeOptions.config.rateLimit.timeWindow && dataLimit.max >= routeOptions.config.rateLimit.max) {
            // Limit reached
            await updateOnLimitExceeded(fastify, settings, hashFull, dataLimit.max);
            if (settings.ban && routeOptions.config.rateLimit.ban && dataLimit.max >= routeOptions.config.rateLimit.ban) {
                await updateOnBan(fastify, settings, hashIP);
            }
            rep.sendError(rep, "Rate Limit Exceeded", 429);
            return rep.getCode204(rep);
        }
        if (timestampNow - timestampUpdated > routeOptions.config.rateLimit.timeWindow) {
            dataLimit.max = 0;
        }
        await updateDataLimit(fastify, settings, hashFull, dataLimit.createdAt, dataLimit.max);
        next();
        return rep.getCode204(rep);
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
