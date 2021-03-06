import path from "path";
import fs from "fs-extra";
import imagesNewDirData from "./data/imagesNewDir.json";

export default () => ({
    schema: {
        body: imagesNewDirData.schema
    },
    attachValidation: true,
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
        if (!acl.checkPermission("imagesBrowser", "create")) {
            response.requestAccessDeniedError();
            return;
        }
        const root = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicImages}`).replace(/\\/gm, "/");
        const srcDir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicImages}/${req.body.dir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || srcDir.indexOf(root) !== 0) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
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
            if (!auth.statusAdmin()) {
                response.unauthorizedError();
                return;
            }
            // Check files
            const errors = [];
            try {
                const destFile = path.resolve(`${srcDir}/${req.body.name}`).replace(/\\/gm, "/");
                try {
                    await fs.access(destFile, fs.F_OK);
                    errors.push(req.body.name);
                } catch {
                    // Ignore
                }
                if (!errors.length) {
                    if (destFile.indexOf(srcDir) !== 0) {
                        errors.push(req.body.name);
                    }
                }
                if (!errors.length) {
                    await fs.mkdir(destFile);
                }
            } catch (e) {
                errors.push(req.body.name);
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
