export default {
    logInfo: (req, message, fastify) => (req || fastify).log.info({
        ip: req ? req.ip : undefined,
        path: req ? req.urlData().path : undefined,
        query: req ? req.urlData().query : undefined,
        msg: message
    }),
    logWarn: (req, message, fastify) => (req || fastify).log.warn({
        ip: req ? req.ip : undefined,
        path: req ? req.urlData().path : undefined,
        query: req ? req.urlData().query : undefined,
        msg: message
    }),
    logError: (req, message, e, fastify) => (req || fastify).log.error({
        ip: req ? req.ip : undefined,
        path: req ? req.urlData().path : undefined,
        query: req ? req.urlData().query : undefined,
        msg: (message || (e && e.message ? e.message : null)) || "Internal Server Error",
        stack: e && req && req.zoiaConfig.stackTrace && e.stack ? e.stack : undefined
    })
};
