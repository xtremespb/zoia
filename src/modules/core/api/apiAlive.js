export default () => ({
    async handler(req, rep) {
        const response = new this.Response(req, rep);
        const log = new this.LoggerHelpers(req, this);
        try {
            return response.successJSON(req.zoiaBuildJson);
        } catch (e) {
            log.error(e);
            return Promise.reject(e);
        }
    }
});
