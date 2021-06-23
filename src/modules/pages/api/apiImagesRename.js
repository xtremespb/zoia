import path from "path";
import fs from "fs-extra";
import imagesRenameData from "./data/imagesRename.json";

export default () => ({
    schema: {
        body: imagesRenameData.schema
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
        if (!acl.checkPermission("imagesBrowser", "update")) {
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
                const srcFile = path.resolve(`${srcDir}/${req.body.src}`).replace(/\\/gm, "/");
                const destFile = path.resolve(`${srcDir}/${req.body.dest}`).replace(/\\/gm, "/");
                try {
                    await fs.access(destFile, fs.F_OK);
                    errors.push(req.body.src);
                } catch {
                    // Ignore
                }
                if (!errors.length) {
                    const stats = await fs.lstat(srcFile);
                    if (srcFile === destFile || srcFile.indexOf(srcDir) !== 0 || destFile.indexOf(srcDir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                        errors.push(req.body.src);
                    }
                }
                if (!errors.length) {
                    await fs.rename(srcFile, destFile);
                    const srcThumb = path.format({
                        ...path.parse(path.resolve(`${srcDir}/tn_${req.body.src}`).replace(/\\/gm, "/")),
                        base: undefined,
                        ext: ".jpg"
                    });
                    const destThumb = path.format({
                        ...path.parse(path.resolve(`${srcDir}/tn_${req.body.dest}`).replace(/\\/gm, "/")),
                        base: undefined,
                        ext: ".jpg"
                    });
                    try {
                        await fs.rename(srcThumb, destThumb);
                    } catch {
                        // Ignore
                    }
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
