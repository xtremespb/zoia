import fs from "fs-extra";
import path from "path";
import moduleConfig from "../module.json";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        const configFile = path.resolve(`${__dirname}/../../etc/zoia.json`);
        try {
            const configData = await fs.readJSON(configFile);
            // Check permission
            if (!acl.checkPermission(moduleConfig.id, "read")) {
                response.requestAccessDeniedError();
                return;
            }
            const data = {
                ...configData.routes,
                commonTableItemsLimit: configData.commonTableItemsLimit,
            };
            Object.keys(req.zoiaConfig.languages).map(i => data[i] = configData.siteMetadata[i]);
            response.successJSON({
                data
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
