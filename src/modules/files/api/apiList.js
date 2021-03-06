import path from "path";
import fs from "fs-extra";
import mime from "mime-types";
import utils from "../../../shared/lib/utils";
import TextOrBinary from "../../../shared/lib/textorbinary";
import filesListData from "./data/filesList.json";

export default () => ({
    schema: {
        body: filesListData.schema
    },
    attachValidation: true,
    async handler(req) {
        const textOrBinary = new TextOrBinary();
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const dir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.dir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || dir.indexOf(root) !== 0) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        if (!acl.checkPermission("files", "read")) {
            response.requestAccessDeniedError();
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
            // Read directory
            const files = await fs.readdir(dir);
            const filesData = (await Promise.all(files.map(async f => {
                const stats = await fs.lstat(path.resolve(`${dir}/${f}`));
                if (!stats.isFile() && !stats.isDirectory()) {
                    return null;
                }
                const data = {
                    name: f,
                    dir: stats.isDirectory(),
                    // eslint-disable-next-line no-bitwise
                    mod: `0${(stats.mode & 0o777).toString(8)}`,
                };
                if (stats.isFile()) {
                    data.size = utils.formatBytes(stats.size);
                    data.mime = f.indexOf(".") > 0 ? mime.lookup(f) || "application/octet-stream" : "application/octet-stream";
                    if ((f.indexOf(".") > 0 && textOrBinary.isBinary(f)) || stats.size > req.zoiaModulesConfig["files"].maxFileEditSizeBytes) {
                        data.ro = true;
                    }
                    if (data.mime === "application/zip") {
                        data.zip = true;
                    }
                }
                return data;
            }))).filter(i => i && i.name !== "node_modules" && !i.name.match(/^\./)).sort(utils.sortByName).sort((a, b) => a.dir && !b.dir ? -1 : !a.dir && b.dir ? 1 : 0);
            // Send result
            response.successJSON({
                files: filesData
            });
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
