import filterSaveData from "./data/filterSave.json";

export default () => ({
    schema: {
        body: filterSaveData.root
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
            // acl,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        // if (!acl.checkPermission("core", "update")) {
        //     response.requestAccessDeniedError();
        //     return;
        // }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        try {
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
