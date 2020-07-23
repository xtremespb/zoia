import path from "path";
import fs from "fs-extra";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const currentDir = req.body.currentDir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.currentDir}`).replace(/\\/gm, "/") : root;
        try {
            await fs.promises.access(currentDir);
            const statsSrc = await fs.lstat(currentDir);
            if (!statsSrc.isDirectory()) {
                throw new Error(`Not a Directory: ${currentDir}`);
            }
        } catch (e) {
            rep.logError(req, e.message);
            rep.requestError(rep, {
                failed: true,
                error: "Non-existent directory",
                errorKeyword: "nonExistentDirectory",
                errorData: []
            });
            return;
        }
        try {
            // Check permissions
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                rep.unauthorizedError(rep);
                return;
            }
            // Check files
            const files = JSON.parse(req.body.filesList);
            const errors = [];
            await Promise.allSettled(files.map(async f => {
                try {
                    const destFile = path.resolve(`${currentDir}/${f}`).replace(/\\/gm, "/");
                    if (!req.body[f] || !req.body[f][0] || !req.body[f][0].data || destFile.indexOf(currentDir) !== 0) {
                        errors.push(f);
                        return;
                    }
                    await fs.writeFile(destFile, req.body[f][0].data);
                } catch (e) {
                    errors.push(f);
                }
            }));
            if (errors.length) {
                rep.requestError(rep, {
                    failed: true,
                    error: "One or more file(s) could not be processed",
                    errorKeyword: "couldNotProcess",
                    errorData: [],
                    files: errors
                });
                return;
            }
            // Send result
            rep.successJSON(rep, {});
            return;
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
