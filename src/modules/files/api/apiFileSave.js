import path from "path";
import fs from "fs-extra";
import fileSaveData from "./data/fileSave.json";

export default () => ({
    schema: {
        body: fileSaveData.schema
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const srcDir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.dir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || srcDir.indexOf(root) !== 0) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        if (!acl.checkPermission("files", "update")) {
            response.requestError({
                failed: true,
                error: "Access Denied",
                errorKeyword: "accessDenied",
                errorData: []
            });
            return;
        }
        try {
            await fs.promises.access(srcDir);
            const statsSrc = await fs.lstat(srcDir);
            if (!statsSrc.isDirectory()) {
                throw new Error(`Not a Directory: ${srcDir}`);
            }
        } catch (e) {
            log.error(e);
            response.requestError({
                failed: true,
                error: "Non-existent directory",
                errorKeyword: "nonExistentDirectory",
                errorData: []
            });
            return;
        }
        try {
            // Check permissions
            if (!auth.checkStatus("admin")) {
                response.unauthorizedError();
                return;
            }
            // Check files
            const errors = [];
            try {
                const destFile = path.resolve(`${srcDir}/${req.body.name}`).replace(/\\/gm, "/");
                const stats = await fs.lstat(destFile);
                if (destFile.indexOf(srcDir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                    errors.push(req.body.src);
                }
                if (stats.size > req.zoiaModulesConfig["files"].maxFileEditSizeBytes) {
                    response.requestError({
                        failed: true,
                        error: "One or more file(s) could not be processed",
                        errorKeyword: "invalidFileSize",
                        errorData: [],
                        files: errors
                    });
                    return;
                }
                if (!errors.length) {
                    await fs.writeFile(destFile, req.body.content);
                }
            } catch (e) {
                errors.push(req.body.src);
            }
            if (errors.length) {
                response.requestError({
                    failed: true,
                    error: "One or more file(s) could not be processed",
                    errorKeyword: "couldNotProcess",
                    errorData: [],
                    files: errors
                });
                return;
            }
            // Send result
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
