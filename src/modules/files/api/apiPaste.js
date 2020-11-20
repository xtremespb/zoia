import path from "path";
import fs from "fs-extra";
import filesPasteData from "./data/filesPaste.json";

export default () => ({
    schema: {
        body: filesPasteData.schema
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const srcDir = req.body.srcDir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.srcDir}`).replace(/\\/gm, "/") : root;
        const destDir = req.body.destDir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.destDir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || srcDir.indexOf(root) !== 0 || destDir.indexOf(root) !== 0) {
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
            await fs.promises.access(destDir);
            const statsDest = await fs.lstat(destDir);
            if (!statsDest.isDirectory()) {
                throw new Error(`Not a Directory: ${destDir}`);
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
            const files = req.body.files.filter(f => !f.match(/\// && !f.match(/^\./) && f !== "node_modules"));
            const errors = [];
            await Promise.all(files.map(async f => {
                try {
                    const srcFile = path.resolve(`${srcDir}/${f}`).replace(/\\/gm, "/");
                    const destFile = path.resolve(`${destDir}/${f}`).replace(/\\/gm, "/");
                    const stats = await fs.lstat(srcFile);
                    if (srcFile.indexOf(srcDir) !== 0 || destFile.indexOf(destDir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                        errors.push(f);
                        return;
                    }
                    if (req.body.mode === "copy") {
                        await fs.copy(srcFile, destFile);
                    } else {
                        await fs.move(srcFile, destFile);
                    }
                } catch (e) {
                    errors.push(f);
                }
            }));
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
