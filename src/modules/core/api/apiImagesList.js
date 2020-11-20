import path from "path";
import fs from "fs-extra";
import mime from "mime-types";
import utils from "../../../shared/lib/utils";
import filesListData from "./data/imagesList.json";

export default () => ({
    schema: {
        body: filesListData.schema
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        // Check permissions
        if (!auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        const root = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}`).replace(/\\/gm, "/");
        const dir = req.body.dir ? path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}/${req.body.dir}`).replace(/\\/gm, "/") : root;
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
            if (!auth.checkStatus("admin")) {
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
                };
                if (stats.isFile()) {
                    data.size = utils.formatBytes(stats.size);
                    data.mime = f.indexOf(".") > 0 ? mime.lookup(f) || "application/octet-stream" : "application/octet-stream";
                }
                try {
                    await fs.promises.access(path.resolve(`${dir}/${`tn_${f.substr(0, f.lastIndexOf("."))}.jpg`}`));
                    data.hasThumb = true;
                } catch {
                    // Do nothing
                }
                return data;
            }))).filter(i => i && i.name !== "node_modules" && !i.name.match(/^tn_/)).sort(utils.sortByName).sort((a, b) => a.dir && !b.dir ? -1 : !a.dir && b.dir ? 1 : 0);
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
