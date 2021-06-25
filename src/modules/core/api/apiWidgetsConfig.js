import widgetsConfigData from "./data/widgetsConfig.json";

export default () => ({
    schema: {
        body: widgetsConfigData.root
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
            const data = await this.mongo.db.collection(req.zoiaModulesConfig["core"].collectionWidgets || "widgets").findOne({
                table: req.body.table,
            });
            response.successJSON({
                config: data && data.widgets ? data.widgets : []
            });
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
