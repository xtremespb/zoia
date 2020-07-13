export default {
    logError: (req, message, e) => req.log.error({
        ip: req.ip,
        path: req.urlData().path,
        query: req.urlData().query,
        error: (message || (e && e.message ? e.message : null)) || 'Internal Server Error',
        stack: e && req.zoiaConfigSecure.stackTrace && e.stack ? e.stack : null
    })
};
