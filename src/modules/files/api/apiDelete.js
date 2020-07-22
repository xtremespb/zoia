import path from "path";
import fs from "fs-extra";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import filesDeleteData from "./data/filesDelete.json";

export default () => ({
    schema: {
        body: filesDeleteData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const dir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.dir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || dir.indexOf(root) !== 0) {
            rep.logError(req, req.validationError ? req.validationError.message : "Request Error");
            rep.validationError(rep, req.validationError || {});
            return;
        }
        try {
            await fs.promises.access(dir);
            const stats = await fs.lstat(dir);
            if (!stats.isDirectory()) {
                throw new Error(`Not a Directory: ${dir}`);
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
            const files = req.body.files.filter(f => !f.match(/\// && !f.match(/^\./) && f !== "node_modules"));
            const errors = [];
            await Promise.all(files.map(async f => {
                try {
                    const file = path.resolve(`${dir}/${f}`).replace(/\\/gm, "/");
                    const stats = await fs.lstat(file);
                    if (file.indexOf(dir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                        errors.push(f);
                        return;
                    }
                    await fs.remove(file);
                } catch (e) {
                    errors.push(f);
                }
            }));
            if (errors.length) {
                rep.requestError(rep, {
                    failed: true,
                    error: "One or more file(s) could not be deleted",
                    errorKeyword: "couldNotDelete",
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
