import fs from "fs-extra";
import path from "path";
import mime from "mime-types";
import Jimp from "jimp";
import {
    exec
} from "child_process";

export default {
    checkDatabaseDuplicates: async (rep, db, collection, query, errorKeyword, field) => {
        const response = new rep.Response(null, rep);
        try {
            const item = await db.collection(collection).findOne(query);
            if (item) {
                response.requestError({
                    failed: true,
                    error: "Database error",
                    errorKeyword,
                    errorData: [{
                        keyword: errorKeyword,
                        dataPath: field ? `.${field}` : undefined
                    }]
                });
                return true;
            }
            return false;
        } catch (e) {
            response.requestError({
                failed: true,
                error: e.message,
                errorKeyword: "general",
                errorData: []
            });
            return true;
        }
    },
    sortByName(a, b) {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;
        }
        return 0;
    },
    sortById(a, b) {
        if (a.id.toLowerCase() < b.id.toLowerCase()) {
            return -1;
        }
        if (a.id.toLowerCase() > b.id.toLowerCase()) {
            return 1;
        }
        return 0;
    },
    sortAsc(a, b) {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    },
    async cleanRemovedFiles(req, db, extendedValidation, dbItem, data) {
        if (dbItem) {
            const dbFiles = extendedValidation.extractFiles(dbItem, "file");
            const formFiles = extendedValidation.extractFiles(data, "file");
            const removedFiles = dbFiles.filter(f => formFiles.indexOf(f) === -1);
            await Promise.allSettled(removedFiles.map(async f => {
                try {
                    const filename = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${f}`);
                    await fs.remove(filename);
                    await db.collection(req.zoiaConfig.collections.files).deleteOne({
                        _id: f
                    });
                } catch (e) {
                    // Ignore
                }
            }));
        }
    },
    async cleanRemovedImages(req, db, extendedValidation, dbItem, data) {
        if (dbItem) {
            const dbFiles = extendedValidation.extractFiles(dbItem, "image");
            const formFiles = extendedValidation.extractFiles(data, "image");
            const removedFiles = dbFiles.filter(f => formFiles.indexOf(f) === -1);
            await Promise.allSettled(removedFiles.map(async f => {
                try {
                    await fs.remove(path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicFiles}/tn_${f}.jpg`));
                    await fs.remove(path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.publicFiles}/${f}.jpg`));
                } catch (e) {
                    // Ignore
                }
            }));
        }
    },
    async saveFiles(req, rep, db, uploadFiles, formData, auth = false, admin = false) {
        const response = new rep.Response(req, rep);
        const duplicates = await db.collection(req.zoiaConfig.collections.files).find({
            $or: uploadFiles.map(f => ({
                _id: f.id
            }))
        }).count();
        if (duplicates) {
            response.requestError({
                failed: true,
                error: "Some files are duplicated",
                errorKeyword: "duplicateFiles",
                errorData: []
            });
            return false;
        }
        let uploadError;
        await Promise.allSettled(uploadFiles.map(async f => {
            try {
                const filename = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${f.id}`);
                await fs.move(formData.files[f.id].filePath, filename);
                await db.collection(req.zoiaConfig.collections.files).updateOne({
                    _id: f.id
                }, {
                    $set: {
                        name: f.name,
                        mime: mime.lookup(f.name) || "application/octet-stream",
                        size: formData.files[f.id].size,
                        admin,
                        auth
                    }
                }, {
                    upsert: true
                });
            } catch (e) {
                uploadError = true;
            }
        }));
        if (uploadError) {
            response.requestError({
                failed: true,
                error: "Some files are not saved",
                errorKeyword: "uploadError",
                errorData: []
            });
            return false;
        }
        return true;
    },
    async saveImages(req, rep, db, uploadImages, formData) { // , auth = false, admin = false
        const response = new rep.Response(req, rep);
        const duplicates = await db.collection(req.zoiaConfig.collections.files).find({
            $or: uploadImages.map(f => ({
                _id: f.id
            }))
        }).count();
        if (duplicates) {
            response.requestError({
                failed: true,
                error: "Some files are duplicated",
                errorKeyword: "duplicateFiles",
                errorData: []
            });
            return false;
        }
        let uploadError;
        await Promise.allSettled(uploadImages.map(async f => {
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
            response.requestError({
                failed: true,
                error: "Some files are not saved",
                errorKeyword: "uploadError",
                errorData: []
            });
            return false;
        }
        return true;
    },
    getFilesAndImagesArr(dataDb, languages) {
        const filesList = [];
        const imagesList = [];
        dataDb.map(item => {
            Object.keys(languages).map(lang => {
                if (item[lang]) {
                    Object.keys(item[lang]).map(k => {
                        const langItem = item[lang][k];
                        if (typeof langItem === "object" && Array.isArray(langItem)) {
                            langItem.map(li => {
                                if (typeof li === "object" && li.type === "file" && li.id) {
                                    filesList.push(li.id);
                                }
                                if (typeof li === "object" && li.type === "image" && li.id) {
                                    imagesList.push(li.id);
                                }
                            });
                        }
                    });
                    delete item[lang];
                }
            });
            Object.keys(item).map(i => {
                const rootItem = item[i];
                if (typeof rootItem === "object" && Array.isArray(rootItem)) {
                    rootItem.map(li => {
                        if (typeof li === "object" && li.type === "file" && li.id) {
                            filesList.push(li.id);
                        }
                        if (typeof li === "object" && li.type === "image" && li.id) {
                            imagesList.push(li.id);
                        }
                    });
                }
            });
        });
        return {
            filesList,
            imagesList
        };
    },
    async removeFiles(filesList, zoiaConfig) {
        await Promise.allSettled(filesList.map(async f => {
            try {
                const filename = path.resolve(`${__dirname}/../../${zoiaConfig.directories.files}/${f}`);
                await fs.remove(filename);
                await this.mongo.db.collection(zoiaConfig.collections.files).deleteOne({
                    _id: f
                });
            } catch (e) {
                // Ignore
            }
        }));
    },
    async removeImages(imagesList, zoiaConfig) {
        await Promise.allSettled(imagesList.map(async f => {
            try {
                await fs.remove(path.resolve(`${__dirname}/../../${zoiaConfig.directories.publicFiles}/${f}.jpg`));
                await fs.remove(path.resolve(`${__dirname}/../../${zoiaConfig.directories.publicFiles}/tn_${f}.jpg`));
            } catch (e) {
                // Ignore
            }
        }));
    },
    getFormDataId(formData) {
        return formData.fields.id && typeof formData.fields.id === "string" && formData.fields.id.match(/^[a-f0-9]{24}$/) ? formData.fields.id : undefined;
    },
    formatBytes(bytes, decimals = 2) {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        if (bytes === 0) {
            return {
                size: 0,
                unit: sizes[0]
            };
        }
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return {
            size: parseFloat((bytes / (k ** i)).toFixed(dm)),
            unit: sizes[i]
        };
    },
    async execShellCommand(cmd, workingDir) {
        return new Promise((resolve, reject) => {
            exec(cmd, {
                cwd: workingDir
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(error || stderr);
                }
                resolve(stdout || stderr);
            });
        });
    },
    getImageBuffer(image) {
        return new Promise(resolve => image.getBuffer("image/png", (err, buf) => resolve(buf)));
    },
    getRandomInt(low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    },
};
