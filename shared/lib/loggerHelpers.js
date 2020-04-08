export default {
    logWarn: (req, message) => req.log.warn({
        ip: req.ip,
        path: req.urlData().path,
        query: req.urlData().query,
        message
    }),
    logError: (req, message, e) => req.log.error({
        ip: req.ip,
        path: req.urlData().path,
        query: req.urlData().query,
        error: (message || (e && e.message ? e.message : null)) || "Internal Server Error",
        stack: e && req.zoiaConfig.stackTrace && e.stack ? e.stack : null
    })
};
