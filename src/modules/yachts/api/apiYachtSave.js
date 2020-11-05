import {
    ObjectId
} from "mongodb";
import path from "path";
import fs from "fs-extra";
import Jimp from "jimp";
import Auth from "../../../shared/lib/auth";
import yachtEdit from "./data/yachtEdit.json";
import C from "../../../shared/lib/constants";

export default () => ({
    attachValidation: false,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Initialize validator
        const formData = await req.processMultipart();
        const extendedValidation = new req.ExtendedValidation(formData, yachtEdit.root, yachtEdit.part, yachtEdit.files, Object.keys(req.zoiaConfig.languages));
        // Perform validation
        const extendedValidationResult = extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        // Get ID from body
        try {
            const id = formData.fields.id && typeof formData.fields.id === "string" && formData.fields.id.match(/^[a-f0-9]{24}$/) ? formData.fields.id : undefined;
            // Get data from form body
            const dataRaw = extendedValidation.getData();
            const data = extendedValidation.filterDataFiles(dataRaw);
            // Check for path duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaModulesConfig["yachts"].collectionYachts, {
                    dir: data.dir || "",
                    filename: data.filename,
                    _id: {
                        $ne: id ? new ObjectId(id) : null
                    }
                }, "pathAlreadyExists", "path")) {
                return;
            }
            // Get files from body
            const uploadFiles = extendedValidation.getFiles();
            // Delete files which are removed
            if (id) {
                const dbItem = await this.mongo.db.collection(req.zoiaModulesConfig["yachts"].collectionYachts).findOne({
                    _id: new ObjectId(id)
                });
                const formFiles = extendedValidation.extractFiles(data);
                const removedFiles = extendedValidation.extractFiles(dbItem).filter(f => formFiles.indexOf(f) === -1);
                await Promise.allSettled(removedFiles.map(async f => {
                    try {
                        await fs.remove(path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicFiles}/${f}.jpg`));
                        await fs.remove(path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicFiles}/tn_${f}.jpg`));
                    } catch (e) {
                        // Ignore
                    }
                }));
            }
            // Upload images
            if (uploadFiles && uploadFiles.length) {
                let uploadError = false;
                await Promise.allSettled(uploadFiles.map(async f => {
                    try {
                        const filename = path.format({
                            ...path.parse(path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicFiles}/${f.id}`).replace(/\\/gm, "/")),
                            base: undefined,
                            ext: ".jpg"
                        });
                        const filenameThumb = path.format({
                            ...path.parse(path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicFiles}/tn_${f.id}`).replace(/\\/gm, "/")),
                            base: undefined,
                            ext: ".jpg"
                        });
                        const fileData = await fs.readFile(formData.files[f.id].filePath);
                        const thumb = await Jimp.read(fileData);
                        if (req.zoiaModulesConfig["core"].images.sizeThumb) {
                            await thumb.scaleToFit(req.zoiaModulesConfig["core"].images.sizeThumb, Jimp.AUTO);
                        }
                        if (req.zoiaModulesConfig["core"].images.qualityThumb) {
                            await thumb.quality(req.zoiaModulesConfig["core"].images.qualityThumb);
                        }
                        const thumbBuffer = await thumb.getBufferAsync(Jimp.MIME_JPEG);
                        await fs.writeFile(filenameThumb, thumbBuffer);
                        const img = await Jimp.read(formData.files[f.id].filePath);
                        if (req.zoiaModulesConfig["core"].images.sizeFull) {
                            await img.scaleToFit(req.zoiaModulesConfig["core"].images.sizeFull, Jimp.AUTO);
                        }
                        if (req.zoiaModulesConfig["core"].images.qualityFull) {
                            await img.quality(req.zoiaModulesConfig["core"].images.qualityFull);
                        }
                        const imgBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);
                        await fs.writeFile(filename, imgBuffer);
                        await fs.remove(formData.files[f.id].filePath);
                    } catch (e) {
                        uploadError = true;
                    }
                }));
                if (uploadError) {
                    await req.removeMultipartTempFiles(formData.files);
                    rep.requestError(rep, {
                        failed: true,
                        error: "Some files are not saved",
                        errorKeyword: "uploadError",
                        errorData: []
                    });
                    return;
                }
            }
            await req.removeMultipartTempFiles(formData.files);
            // Process case and trim
            data.filename = data.filename.trim().toLowerCase();
            // Extras
            const updateExtras = {};
            // Set createdAt timestamp if that's a new record
            if (!id) {
                updateExtras.createdAt = new Date();
            }
            // Update database
            const update = await this.mongo.db.collection(req.zoiaModulesConfig["yachts"].collectionYachts).updateOne(id ? {
                _id: new ObjectId(id)
            } : {
                dir: data.dir || "",
                filename: data.filename,
            }, {
                $set: {
                    ...data,
                    dir: data.dir || "",
                    filename: data.filename,
                    modifiedAt: new Date(),
                    ...updateExtras
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "databaseError",
                    errorData: []
                });
                return;
            }
            // Return "success" result
            rep.successJSON(rep);
            return;
        } catch (e) {
            // There is an exception, send error 500 as response
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
