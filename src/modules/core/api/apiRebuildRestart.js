import path from "path";
import utils from "../../../shared/lib/utils";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        try {
            // Check permissions
            if (!auth.statusAdmin()) {
                response.unauthorizedError();
                return;
            }
            if (!acl.checkPermission("core", "update")) {
                response.requestAccessDeniedError();
                return;
            }
            const registry = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "update"
            });
            if (!registry || registry.status !== 0) {
                response.requestError({
                    failed: true,
                    error: "Update has been not performed",
                    errorKeyword: "updateNotPerformed",
                    errorData: []
                });
                return;
            }
            await this.mongo.db.collection(req.zoiaConfig.collections.registry).deleteOne({
                _id: "update"
            });
            // Let's hope we will be able to auto-restart ;-)
            response.successJSON();
            const workingDir = path.resolve(`${__dirname}/../..`);
            await utils.execShellCommand("npm run restart", workingDir);
            process.exit(0);
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
