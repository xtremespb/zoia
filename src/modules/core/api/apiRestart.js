import path from "path";
import utils from "../../../shared/lib/utils";

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
        try {
            // Check permissions
            if (!acl.checkPermission("core", "update")) {
                response.requestAccessDeniedError();
                return;
            }
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
