import path from "path";
import fs from "fs-extra";
import archiver from "archiver";
import filesZIPData from "./data/filesZIP.json";

export default () => ({
    schema: {
        body: filesZIPData.schema
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
        if (!acl.checkPermission("files", "create")) {
            response.requestAccessDeniedError();
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
            const files = req.body.files.filter(f => !f.match(/\// && !f.match(/^\./) && f !== "node_modules"));
            const errors = [];
            const destFile = path.resolve(`${srcDir}/${req.body.name}`).replace(/\\/gm, "/");
            if (destFile.indexOf(srcDir) !== 0) {
                errors.push(req.body.name);
            }
            const archive = archiver("zip", {
                zlib: {
                    level: 9
                }
            });
            let output;
            if (!errors.length) {
                output = fs.createWriteStream(destFile);
                archive.pipe(output);
                await Promise.all(files.map(async f => {
                    try {
                        const srcFile = path.resolve(`${srcDir}/${f}`).replace(/\\/gm, "/");
                        const stats = await fs.lstat(srcFile);
                        if (srcFile.indexOf(srcDir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                            errors.push(f);
                            return;
                        }
                        // Add item
                        if (stats.isFile()) {
                            archive.append(srcFile, {
                                name: f
                            });
                        } else {
                            archive.directory(srcFile, f);
                        }
                    } catch (e) {
                        errors.push(f);
                    }
                }));
            }
            if (!output || errors.length) {
                response.requestError({
                    failed: true,
                    error: "One or more file(s) could not be processed",
                    errorKeyword: "couldNotProcess",
                    errorData: [],
                    files: errors
                });
                return;
            }
            archive.finalize();
            // Send result
            output.on("close", () => {
                response.successJSON();
            });
            archive.on("error", () => {
                response.requestError({
                    failed: true,
                    error: "One or more file(s) could not be processed",
                    errorKeyword: "couldNotProcess",
                    errorData: [],
                    files: errors
                });
            });
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
