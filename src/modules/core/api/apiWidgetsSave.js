import widgetsSaveData from "./data/widgetsSave.json";

export default () => ({
    schema: {
        body: widgetsSaveData.root
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkCorePermission("tableSettings")) {
            response.requestAccessDeniedError();
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        try {
            await this.mongo.db.collection(req.zoiaModulesConfig["core"].collectionWidgets || "widgets").updateOne({
                table: req.body.table,
            }, {
                $set: {
                    table: req.body.table,
                    widgets: req.body.widgets,
                }
            }, {
                upsert: true,
            });
            response.successJSON({});
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
