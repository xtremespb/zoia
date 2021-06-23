import columnsSaveData from "./data/columnsSave.json";

export default () => ({
    schema: {
        body: columnsSaveData.root
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
            await this.mongo.db.collection(req.zoiaModulesConfig["core"].collectionColumns || "columns").updateOne({
                userId: String(auth.getUser()._id),
                table: req.body.table,
            }, {
                $set: {
                    userId: String(auth.getUser()._id),
                    table: req.body.table,
                    ratios: req.body.ratios,
                    columns: req.body.columns,
                    itemsPerPage: req.body.itemsPerPage,
                    autoItemsPerPage: req.body.autoItemsPerPage,
                }
            }, {
                upsert: true,
            });
            response.successJSON({});
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
