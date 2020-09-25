/* eslint-disable consistent-return */
import path from "path";
import fs from "fs-extra";
import fileDownloadData from "./data/fileDownload.json";

export default () => ({
    schema: {
        query: fileDownloadData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError ? req.validationError.message : "Request Error");
            rep.validationError(rep, req.validationError || {});
            return;
        }
        try {
            const file = await this.mongo.db.collection(req.zoiaConfig.collections.files).findOne({
                _id: req.query.id
            });
            if (!file) {
                rep.callNotFound();
                return rep.code(204);
            }
            const srcFile = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${req.query.id}`).replace(/\\/gm, "/");
            try {
                const stats = await fs.lstat(srcFile);
                if (!stats.isFile() && !stats.isDirectory()) {
                    rep.callNotFound();
                    return rep.code(204);
                }
            } catch {
                rep.callNotFound();
                return rep.code(204);
            }
            const stream = fs.createReadStream(srcFile);
            rep.header("Content-disposition", `attachment; filename=${file.name}`).type(file.mime).send(stream);
            return;
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
