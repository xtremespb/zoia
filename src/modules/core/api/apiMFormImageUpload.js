import path from "path";
import fs from "fs-extra";
import Jimp from "jimp";
import {
    v4 as uuid
} from "uuid";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        // Check permissions
        if (!auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkPermission("core", "create")) {
            response.requestError({
                failed: true,
                error: "Access Denied",
                errorKeyword: "accessDenied",
                errorData: []
            });
            return;
        }
        try {
            const formData = await req.processMultipart();
            const root = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}`).replace(/\\/gm, "/");
            try {
                await fs.promises.access(root);
                const statsSrc = await fs.lstat(root);
                if (!statsSrc.isDirectory()) {
                    throw new Error(`Not a Directory: ${root}`);
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
            if (!auth.checkStatus("admin")) {
                response.unauthorizedError();
                return;
            }
            let f;
            // Check files
            try {
                f = `${uuid()}.${path.extname(formData.files.upload.filename)}`;
                const destFile = path.resolve(`${root}/${f}`).replace(/\\/gm, "/");
                const fileData = await fs.readFile(formData.files.upload.filePath);
                if (!fileData || destFile.indexOf(root) !== 0) {
                    throw new Error("Invalid file");
                }
                const destThumbFile = path.format({
                    ...path.parse(path.resolve(`${root}/tn_${f}`).replace(/\\/gm, "/")),
                    base: undefined,
                    ext: ".jpg"
                });
                try {
                    const thumb = await Jimp.read(fileData);
                    if (req.zoiaModulesConfig["core"].images.sizeThumb) {
                        await thumb.scaleToFit(req.zoiaModulesConfig["core"].images.sizeThumb, Jimp.AUTO);
                    }
                    if (req.zoiaModulesConfig["core"].images.qualityThumb) {
                        await thumb.quality(req.zoiaModulesConfig["core"].images.qualityThumb);
                    }
                    const thumbBuffer = await thumb.getBufferAsync(Jimp.MIME_JPEG);
                    await fs.writeFile(destThumbFile, thumbBuffer);
                    const img = await Jimp.read(fileData);
                    if (req.zoiaModulesConfig["core"].images.sizeFull) {
                        await img.scaleToFit(req.zoiaModulesConfig["core"].images.sizeFull, Jimp.AUTO);
                    }
                    if (req.zoiaModulesConfig["core"].images.qualityFull) {
                        await img.quality(req.zoiaModulesConfig["core"].images.qualityFull);
                    }
                    const imgBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);
                    await fs.writeFile(destFile, imgBuffer);
                } catch (e) {
                    throw new Error("Invalid file");
                }
            } catch (e) {
                await req.removeMultipartTempFiles(formData.files);
                response.requestError({
                    failed: true,
                    error: "One or more file(s) could not be processed",
                    errorKeyword: "couldNotProcess",
                    errorData: [],
                });
                return;
            }
            // Send result
            response.successJSON({
                url: `/images/${f}`
            });
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
