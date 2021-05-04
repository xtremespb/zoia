import path from "path";
import fs from "fs-extra";
import filesDeleteData from "./data/imagesDelete.json";

export default () => ({
    schema: {
        body: filesDeleteData.schema
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkPermission("core", "delete")) {
            response.requestAccessDeniedError();
            return;
        }
        const root = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicImages}`).replace(/\\/gm, "/");
        const dir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicImages}/${req.body.dir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || dir.indexOf(root) !== 0) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        try {
            await fs.promises.access(dir);
            const stats = await fs.lstat(dir);
            if (!stats.isDirectory()) {
                throw new Error(`Not a Directory: ${dir}`);
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
            const files = req.body.files.filter(f => !f.match(/\// && !f.match(/^tn_/) && f !== "node_modules"));
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
                    // Also delete thumbnail
                    try {
                        await fs.remove(path.format({
                            ...path.parse(path.resolve(`${dir}/tn_${f}`).replace(/\\/gm, "/")),
                            base: undefined,
                            ext: ".jpg"
                        }));
                    } catch {
                        // Ignore
                    }
                } catch (e) {
                    errors.push(f);
                }
            }));
            if (errors.length) {
                response.requestError({
                    failed: true,
                    error: "One or more file(s) could not be deleted",
                    errorKeyword: "couldNotDelete",
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
