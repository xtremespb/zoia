import path from "path";
import fs from "fs-extra";
import {
    isBinary
} from "istextorbinary";
import mime from "mime-types";
import fileLoadData from "./data/fileLoad.json";

export default () => ({
    schema: {
        body: fileLoadData.schema
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
        if (!acl.checkPermission("files", "read")) {
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
                if (data.content.length > req.zoiaModulesConfig["files"].maxFileEditSizeBytes) {
                    response.requestError({
                        failed: true,
                        error: "One or more file(s) could not be processed",
                        errorKeyword: "invalidFileSize",
                        errorData: [],
                        files: errors
                    });
                    return;
                }
                if (isBinary(req.body.name, data.content)) {
                    response.requestError({
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
            response.successJSON(data);
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
