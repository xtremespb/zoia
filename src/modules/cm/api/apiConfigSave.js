import path from "path";
import fs from "fs-extra";
import Auth from "../../../shared/lib/auth";
import configEdit from "./data/configEdit.json";
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
        const extendedValidation = new req.ExtendedValidation(formData, configEdit.root, null, configEdit.files, Object.keys(req.zoiaConfig.languages));
        // Perform validation
        const extendedValidationResult = extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        const root = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${req.zoiaModulesConfig["cm"].directoryTemplates}`).replace(/\\/gm, "/");
        // Get ID from body
        try {
            // Get data from form body
            const dataRaw = extendedValidation.getData();
            const data = extendedValidation.filterDataFiles(dataRaw);
            // Get files from body
            const uploadFiles = extendedValidation.getFiles();
            // Upload files
            if (uploadFiles && uploadFiles.length) {
                let uploadError;
                await Promise.allSettled(uploadFiles.map(async f => {
                    try {
                        const filename = path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${req.zoiaModulesConfig["cm"].directoryTemplates}/${f.name}`).replace(/\\/gm, "/");
                        if (filename.indexOf(root) !== 0) {
                            throw new Error("Invalid file path");
                        }
                        try {
                            await fs.remove(filename);
                        } catch {
                            // Ignore
                        }
                        await fs.move(formData.files[f.id].filePath, filename);
                    } catch (e) {
                        uploadError = true;
                    }
                }));
                await req.removeMultipartTempFiles(formData.files);
                if (uploadError) {
                    rep.requestError(rep, {
                        failed: true,
                        error: "File upload error",
                        errorKeyword: "uploadError",
                        errorData: []
                    });
                    return;
                }
            }
            await req.removeMultipartTempFiles(formData.files);
            // Check JSON
            try {
                data.config = JSON.parse(data.config);
            } catch {
                rep.requestError(rep, {
                    failed: true,
                    error: "JSON parse error",
                    errorKeyword: "jsonError",
                    errorData: []
                });
                return;
            }
            data.attachments = [];
            // Save data
            const update = await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                _id: "cm_data"
            }, {
                $set: {
                    ...data,
                    modifiedAt: new Date(),
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
