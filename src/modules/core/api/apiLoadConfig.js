export default () => ({
    async handler(req, rep) {
        try {
            return rep.sendSuccessJSON(rep, {
                config: req.zoiaConfig,
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
