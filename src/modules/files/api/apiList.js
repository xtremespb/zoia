import path from "path";
import fs from "fs-extra";
import mime from "mime-types";
import {
    isBinary
} from "istextorbinary";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import utils from "../../../shared/lib/utils";
import filesListData from "./data/filesList.json";

export default () => ({
    schema: {
        body: filesListData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        const root = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}`).replace(/\\/gm, "/");
        const dir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["files"].root}/${req.body.dir}`).replace(/\\/gm, "/") : root;
        // Validate form
        if (req.validationError || dir.indexOf(root) !== 0) {
            rep.logError(req, req.validationError ? req.validationError.message : "Request Error");
            rep.validationError(rep, req.validationError || {});
            return;
        }
        try {
            await fs.promises.access(dir);
            const stats = await fs.lstat(dir);
            if (!stats.isDirectory()) {
                throw new Error(`Not a Directory: ${dir}`);
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
                    if ((f.indexOf(".") > 0 && isBinary(f)) || stats.size > req.zoiaModulesConfig["files"].maxFileEditSizeBytes) {
                        data.ro = true;
                    }
                }
                return data;
            }))).filter(i => i && i.name !== "node_modules" && !i.name.match(/^\./)).sort(utils.sortByName).sort((a, b) => a.dir && !b.dir ? -1 : !a.dir && b.dir ? 1 : 0);
            // Send result
            rep.successJSON(rep, {
                files: filesData
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
