import fastifyPlugin from "fastify-plugin";
import ipAddr from "./ipaddr";
import xx64 from "./xxhash";

const checkIp = (addr, cidr) => {
    try {
        const parsedAddr = ipAddr.process(addr);
        if (cidr.indexOf("/") === -1) {
            const parsedCidrIp = ipAddr.process(cidr);
            if ((parsedAddr.kind() === "ipv6") && (parsedCidrIp.kind() === "ipv6")) {
                return parsedAddr.toNormalizedString() === parsedCidrIp.toNormalizedString();
            }
            return parsedAddr.toString() === parsedCidrIp.toString();
        }
        const parsedRange = ipAddr.parseCIDR(cidr);
        return parsedAddr.match(parsedRange);
    } catch (e) {
        return false;
    }
};

const getLimitData = async (fastify, settings, hashFull) => {
    const defaults = {
        createdAt: new Date(),
        updatedAt: new Date(),
        max: 0
    };
    if (settings.redis && fastify.redis) {
        const dataLimit = await fastify.redis.get(`${fastify.zoiaConfig.id}_rateLimit_${hashFull}`);
        const data = dataLimit ? dataLimit.split(",") : [defaults.updatedAt, defaults.max];
        data[0] = typeof data[0] === "string" ? new Date(data[0] * 1000) : data[0];
        return {
            createdAt: defaults.createdAt,
            updatedAt: data[0],
            max: parseInt(data[1], 10)
        };
    }
    const dataLimit = (await fastify.mongo.db.collection("rateLimit").findOne({
        _id: hashFull
    })) || defaults;
    return dataLimit;
};

const getBanData = async (fastify, settings, hashIP) => {
    if (settings.redis && fastify.redis) {
        const dataBan = await fastify.redis.get(`${fastify.zoiaConfig.id}_rateBan_${hashIP}`);
        return !!dataBan;
    }
    const dataBan = await fastify.mongo.db.collection("rateBan").findOne({
        _id: hashIP
    });
    return !!dataBan;
};

const updateOnLimitExceeded = async (fastify, settings, hashFull, max) => {
    const data = {
        createdAt: new Date(),
        updatedAt: new Date(),
        max
    };
    if (settings.redis && fastify.redis) {
        await fastify.redis.set(`${fastify.zoiaConfig.id}_rateLimit_${hashFull}`, `${parseInt(data.updatedAt.getTime() / 1000, 10)},${data.max}`, "ex", 3600);
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
        await fastify.redis.set(`${fastify.zoiaConfig.id}_rateBan_${hashIP}`, 1, "ex", 86400);
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
        await fastify.redis.set(`${fastify.zoiaConfig.id}_rateLimit_${hashFull}`, `${parseInt(data.updatedAt.getTime() / 1000, 10)},${data.max}`, "ex", 3600);
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

const checkWhiteList = (settings, req) => {
    let whiteListed = false;
    if (settings.whiteList && Array.isArray(settings.whiteList)) {
        settings.whiteList.map(ip => {
            if (checkIp(req.ip, ip)) {
                whiteListed = true;
            }
        });
    }
    return whiteListed;
};

const checkBlackList = (settings, req) => {
    let blackListed = false;
    if (settings.blackList && Array.isArray(settings.blackList)) {
        settings.blackList.map(ip => {
            if (checkIp(req.ip, ip)) {
                blackListed = true;
            }
        });
    }
    return blackListed;
};

const buildRate = async (fastify, settings, routeOptions) => {
    routeOptions.rateLimit = routeOptions.rateLimit || settings.global;
    const preHandlerRate = async (req, rep, next) => {
        if (checkWhiteList(settings, req)) {
            return;
        }
        const hashFull = xx64(`${req.ip}${req.urlData().path}`, fastify.zoiaConfig.secretInt).toString(16);
        const hashIP = xx64(req.ip, fastify.zoiaConfig.secretInt).toString(16);
        const dataLimit = await getLimitData(fastify, settings, hashFull);
        dataLimit.max += 1;
        const timestampNow = new Date().getTime();
        const timestampUpdated = dataLimit.updatedAt.getTime();
        if (timestampNow - timestampUpdated <= routeOptions.rateLimit.timeWindow && dataLimit.max >= routeOptions.rateLimit.max) {
            // Limit reached
            await updateOnLimitExceeded(fastify, settings, hashFull, dataLimit.max);
            if (settings.ban && routeOptions.rateLimit.ban && dataLimit.max >= routeOptions.rateLimit.ban) {
                await updateOnBan(fastify, settings, hashIP);
            }
            if (settings.addHeaders) {
                if (settings.addHeaders["x-ratelimit-limit"]) {
                    rep.header("x-ratelimit-limit", routeOptions.rateLimit.max);
                }
                if (settings.addHeaders["x-ratelimit-remaining"]) {
                    rep.header("x-ratelimit-remaining", 0);
                }
                if (settings.addHeaders["x-ratelimit-reset"]) {
                    rep.header("x-ratelimit-reset", 3600);
                }
                if (settings.addHeaders["retry-after"]) {
                    rep.header("retry-after", routeOptions.rateLimit.timeWindow);
                }
            }
            const err = new Error(`Rate limit exceeded, retry in ${routeOptions.rateLimit.timeWindow / 1000} second(s)`);
            err.code = 429;
            next(err, req, rep, fastify);
        }
        if (timestampNow - timestampUpdated > routeOptions.rateLimit.timeWindow) {
            dataLimit.max = 0;
        }
        await updateDataLimit(fastify, settings, hashFull, dataLimit.createdAt, dataLimit.max);
    };
    const preHandlerBan = async (req, rep, next) => {
        const err = new Error("Forbidden, your IP is blacklisted");
        err.code = 403;
        if (checkBlackList(settings, req)) {
            next(err, req, rep, fastify);
            return;
        }
        const hashIP = xx64(req.ip, fastify.zoiaConfig.secretInt).toString(16);
        const dataBan = await getBanData(fastify, settings, hashIP);
        if (dataBan) {
            next(err, req, rep, fastify);
        }
    };
    // Add pre-handler to the route
    if (!Array.isArray(routeOptions.onRequest)) {
        routeOptions.onRequest = routeOptions.onRequest ? [routeOptions.onRequest] : [];
    }
    if (settings.ban) {
        routeOptions.onRequest.push(preHandlerBan);
    }
    if (routeOptions.rateLimit || (settings.global && Object.keys(settings.global).length)) {
        routeOptions.onRequest.push(preHandlerRate);
    }
};

const rateLimitPlugin = (fastify, settings, next) => {
    fastify.addHook("onRoute", async routeOptions => {
        await buildRate(fastify, settings, routeOptions);
    });
    next();
};

export default fastifyPlugin(rateLimitPlugin, {
    fastify: ">=2.x",
    name: "zoia-rate-limit"
});
