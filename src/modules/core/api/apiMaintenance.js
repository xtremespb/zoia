import coreMaintenanceData from "./data/coreMaintenance.json";

export default () => ({
    schema: {
        body: coreMaintenanceData.schema
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        // Check permissions
        if (!auth.checkStatus("admin")) {
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
            const resultSave = await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                _id: "core_maintenance"
            }, {
                $set: {
                    status: req.body.status
                }
            }, {
                upsert: true
            });
            if (!resultSave || !resultSave.result || !resultSave.result.ok) {
                response.requestError({
                    failed: true,
                    error: "Could not update one or more items",
                    errorKeyword: "couldNotProcess",
                    errorData: []
                });
                return;
            }
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
