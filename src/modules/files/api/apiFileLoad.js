import path from "path";
import fs from "fs-extra";
import {
    isBinary
} from "istextorbinary";
import mime from "mime-types";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import fileLoadData from "./data/fileLoad.json";

export default () => ({
    schema: {
        body: fileLoadData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const srcDir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.dir}`).replace(/\\/gm, "/") : root;
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
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                rep.unauthorizedError(rep);
                return;
            }
            // Check files
            const errors = [];
            const data = {};
            try {
                const srcFile = path.resolve(`${srcDir}/${req.body.name}`).replace(/\\/gm, "/");
                const stats = await fs.lstat(srcFile);
                if (srcFile.indexOf(srcDir) !== 0 || (!stats.isFile() && !stats.isDirectory())) {
                    errors.push(req.body.name);
                }
                if (!errors.length) {
                    // Open file
                    data.content = await fs.readFile(srcFile, {
                        encoding: "utf-8"
                    });
                }
                if (!data.content || data.content.length > req.zoiaModulesConfig["files"].maxFileEditSizeBytes) {
                    rep.requestError(rep, {
                        failed: true,
                        error: "One or more file(s) could not be processed",
                        errorKeyword: "invalidFileSize",
                        errorData: [],
                        files: errors
                    });
                    return;
                }
                if (isBinary(req.body.name, data.content)) {
                    rep.requestError(rep, {
                        failed: true,
                        error: "One or more file(s) could not be processed",
                        errorKeyword: "binaryFile",
                        errorData: [],
                        files: errors
                    });
                    return;
                }
                data.mime = req.body.name.indexOf(".") > 0 ? mime.lookup(req.body.name) || "application/octet-stream" : "application/octet-stream";
            } catch (e) {
                errors.push(req.body.name);
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
            // Send result
            rep.successJSON(rep, data);
            return;
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
