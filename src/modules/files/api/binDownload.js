import path from "path";
import fs from "fs-extra";
import mime from "mime-types";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import fileLoadData from "./data/fileLoad.json";

export default () => ({
    schema: {
        query: fileLoadData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const srcDir = req.query.dir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.query.dir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || srcDir.indexOf(root) !== 0) {
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
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                rep.unauthorizedError(rep);
                return;
            }
            // Check files
            const errors = [];
            try {
                const srcFile = path.resolve(`${srcDir}/${req.query.name}`).replace(/\\/gm, "/");
                const stats = await fs.lstat(srcFile);
                if (srcFile.indexOf(srcDir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                    errors.push(req.query.name);
                }
                const stream = fs.createReadStream(srcFile);
                rep.header("Content-disposition", `attachment; filename=${req.query.name}`).type(req.query.name.indexOf(".") > 0 ? mime.lookup(req.query.name) || "application/octet-stream" : "application/octet-stream").send(stream);
                return;
            } catch (e) {
                errors.push(req.query.name);
            }
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
            return;
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
