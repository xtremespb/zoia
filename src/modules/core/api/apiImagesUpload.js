import path from "path";
import fs from "fs-extra";
import Jimp from "jimp";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        try {
            const currentDirValue = await req.body.currentDir.value;
            const root = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}`).replace(/\\/gm, "/");
            const currentDir = currentDirValue ? path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.images}/${currentDirValue}`).replace(/\\/gm, "/") : root;
            try {
                await fs.promises.access(currentDir);
                const statsSrc = await fs.lstat(currentDir);
                if (!statsSrc.isDirectory()) {
                    throw new Error(`Not a Directory: ${currentDir}`);
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
            // Check permissions
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                rep.unauthorizedError(rep);
                return;
            }
            // Check files
            const filesValue = await req.body.filesList.value;
            const files = JSON.parse(filesValue);
            const errors = [];
            await Promise.allSettled(files.map(async f => {
                try {
                    const destFile = path.resolve(`${currentDir}/${f}`).replace(/\\/gm, "/");
                    const fileData = await req.body[f].toBuffer();
                    if (!fileData || destFile.indexOf(currentDir) !== 0) {
                        errors.push(f);
                        return;
                    }
                    const destThumbFile = path.resolve(`${currentDir}/.tn_${f}`).replace(/\\/gm, "/");
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
                        console.log(e);
                        errors.push(f);
                        return;
                    }
                } catch (e) {
                    console.log(e);
                    errors.push(f);
                }
            }));
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
            rep.successJSON(rep, {});
            return;
        } catch (e) {
            console.log(e);
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
