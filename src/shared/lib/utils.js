import fs from "fs-extra";
import path from "path";
import mime from "mime-types";
import {
    exec
} from "child_process";

export default {
    checkDatabaseDuplicates: async (rep, db, collection, query, errorKeyword, field) => {
        try {
            const item = await db.collection(collection).findOne(query);
            if (item) {
                rep.requestError(rep, {
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
            rep.requestError(rep, {
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
            const dbFiles = extendedValidation.extractFiles(dbItem);
            const formFiles = extendedValidation.extractFiles(data);
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
    async saveFiles(req, rep, db, uploadFiles, auth = false, admin = false) {
        const duplicates = await db.collection(req.zoiaConfig.collections.files).find({
            $or: uploadFiles.map(f => ({
                _id: f.id
            }))
        }).count();
        if (duplicates) {
            rep.requestError(rep, {
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
                await fs.writeFile(filename, req.body[f.id][0].data);
                await db.collection(req.zoiaConfig.collections.files).updateOne({
                    _id: f.id
                }, {
                    $set: {
                        name: f.name,
                        mime: mime.lookup(f.name) || "application/octet-stream",
                        size: req.body[f.id][0].data.length,
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
            rep.requestError(rep, {
                failed: true,
                error: "Some files are not saved",
                errorKeyword: "uploadError",
                errorData: []
            });
            return false;
        }
        return true;
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
    }
};
