import path from "path";
import fs from "fs-extra";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const response = new this.Response(req, rep); const log = new this.LoggerHelpers(req, this);
        try {
            const formData = await req.processMultipart();
            const currentDirValue = formData.fields.currentDir;
            const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
            const currentDir = currentDirValue ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${currentDirValue}`).replace(/\\/gm, "/") : root;
            try {
                await fs.promises.access(currentDir);
                const statsSrc = await fs.lstat(currentDir);
                if (!statsSrc.isDirectory()) {
                    throw new Error(`Not a Directory: ${currentDir}`);
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
            // Check permissions
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                response.unauthorizedError();
                return;
            }
            // Check files
            const filesValue = await formData.fields.filesList;
            const files = JSON.parse(filesValue);
            const errors = [];
            await Promise.allSettled(files.map(async f => {
                try {
                    const destFile = path.resolve(`${currentDir}/${f}`).replace(/\\/gm, "/");
                    if (destFile.indexOf(currentDir) !== 0) {
                        errors.push(f);
                        return;
                    }
                    await fs.move(formData.files[f].filePath, destFile);
                } catch (e) {
                    errors.push(f);
                }
            }));
            await req.removeMultipartTempFiles(formData.files);
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
