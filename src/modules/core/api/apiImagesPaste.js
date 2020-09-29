import path from "path";
import fs from "fs-extra";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import filesPasteData from "./data/imagesPaste.json";

export default () => ({
    schema: {
        body: filesPasteData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        const root = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}`).replace(/\\/gm, "/");
        const srcDir = req.body.srcDir ? path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}/${req.body.srcDir}`).replace(/\\/gm, "/") : root;
        const destDir = req.body.destDir ? path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}/${req.body.destDir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || srcDir.indexOf(root) !== 0 || destDir.indexOf(root) !== 0) {
            rep.logError(req, req.validationError ? req.validationError.message : "Request Error");
            rep.validationError(rep, req.validationError || {});
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
                    const srcFile = path.resolve(`${srcDir}/${f}`).replace(/\\/gm, "/");
                    const destFile = path.resolve(`${destDir}/${f}`).replace(/\\/gm, "/");
                    const stats = await fs.lstat(srcFile);
                    if (srcFile.indexOf(srcDir) !== 0 || destFile.indexOf(destDir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                        errors.push(f);
                        return;
                    }
                    const srcThumb = path.format({
                        ...path.parse(path.resolve(`${srcDir}/.tn_${f}`).replace(/\\/gm, "/")),
                        base: undefined,
                        ext: ".jpg"
                    });
                    const destThumb = path.format({
                        ...path.parse(path.resolve(`${destDir}/.tn_${f}`).replace(/\\/gm, "/")),
                        base: undefined,
                        ext: ".jpg"
                    });
                    if (req.body.mode === "copy") {
                        await fs.copy(srcFile, destFile);
                        try {
                            await fs.copy(srcThumb, destThumb);
                        } catch {
                            // Ignore
                        }
                    } else {
                        await fs.move(srcFile, destFile);
                        try {
                            await fs.move(srcThumb, destThumb);
                        } catch {
                            // Ignore
                        }
                    }
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
