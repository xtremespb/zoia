import path from "path";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import utils from "../../../shared/lib/utils";

export default () => ({
    async handler(req, rep) {
        try {
            // Check permissions
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                rep.unauthorizedError(rep);
                return;
            }
            // Let's hope we will be able to auto-restart ;-)
            rep.successJSON(rep, {});
            const workingDir = path.resolve(`${__dirname}/../..`);
            await utils.execShellCommand("npm run restart", workingDir);
            process.exit(0);
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
