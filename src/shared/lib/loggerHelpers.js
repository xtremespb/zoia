export default class {
    constructor(req, fastify) {
        this.req = req;
        this.fastify = fastify;
        this.ip = req ? req.ip : undefined;
        this.path = req ? req.urlData().path : undefined;
        this.query = req ? req.urlData().query : undefined;
    }

    info(msg) {
        (this.req || this.fastify).log.info({
            ip: this.ip,
            path: this.path,
            query: this.query,
            msg
        });
    }

    warn(msg) {
        (this.req || this.fastify).log.warn({
            ip: this.ip,
            path: this.path,
            query: this.query,
            msg
        });
    }

    error(e, msg) {
        (this.req || this.fastify).log.error({
            ip: this.ip,
            path: this.path,
            query: this.query,
            msg: (msg || (e && e.message ? e.message : null)) || "Internal Server Error",
            stack: e && this.req && this.req.zoiaConfig && this.req.zoiaConfig.stackTrace && e.stack ? e.stack : undefined
        });
    }
}
