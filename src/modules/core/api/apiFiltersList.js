import filterLoadData from "./data/filterLoad.json";

export default () => ({
    schema: {
        body: filterLoadData.root
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        try {
            const filters = await this.mongo.db.collection(req.zoiaModulesConfig["core"].collectionFilters || "filters").find({
                $or: [{
                    userId: String(auth.getUser()._id),
                    table: req.body.table,
                    type: 1,
                }, {
                    table: req.body.table,
                    type: 2,
                }]
            }).toArray();
            response.successJSON({
                filters
            });
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
