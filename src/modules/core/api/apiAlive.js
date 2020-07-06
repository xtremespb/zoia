export default () => ({
    async handler(req, rep) {
        try {
            return rep.successJSON(rep, req.zoiaBuildJson);
        } catch (e) {
            rep.logError(req, null, e);
            return Promise.reject(e);
        }
    }
});
