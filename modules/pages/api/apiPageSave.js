import {
    ObjectId
} from "mongodb";
import Auth from "../../../shared/lib/auth";
import utils from "../../../shared/lib/utils";
import pageEdit from "./data/pageEdit.json";
import C from "../../../shared/lib/constants";

export default fastify => ({
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, fastify, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(req.body, pageEdit.root, pageEdit.part, pageEdit.files, Object.keys(req.zoiaConfig.languages));
        // Perform validation
        const extendedValidationResult = extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        // Get ID from body
        const id = req.body.id && typeof req.body.id === "string" && req.body.id.match(/^[a-f0-9]{24}$/) ? req.body.id : undefined;
        try {
            // Get data from form body
            const dataRaw = extendedValidation.getData();
            const data = extendedValidation.filterDataFiles(dataRaw);
            // Get files from body
            const uploadFiles = extendedValidation.getFiles();
            // Delete files which are removed
            if (id) {
                const dbItem = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).findOne({
                    _id: new ObjectId(id)
                });
                await utils.cleanRemovedFiles(req, this.mongo.db, extendedValidation, dbItem, data);
            }
            // Upload files
            if (uploadFiles && uploadFiles.length && !(await utils.saveFiles(req, rep, this.mongo.db, uploadFiles, C.UPLOAD_AUTH, C.UPLOAD_ADMIN))) {
                return;
            }
            // Process case and trim
            data.path = data.path.trim().toLowerCase();
            // Check for path duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaModulesConfig["pages"].collectionPages, {
                    path: data.path,
                    _id: {
                        $ne: id ? new ObjectId(id) : null
                    }
                }, "pathAlreadyExists", "path")) {
                return;
            }
            const updateExtras = {};
            // Set createdAt timestamp if that's a new record
            if (!id) {
                updateExtras.createdAt = new Date();
            }
            // Update database
            Object.keys(req.zoiaConfig.languages).map(k => {
                if (!data[k]) {
                    data[k] = undefined;
                }
            });
            const update = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).updateOne(id ? {
                _id: new ObjectId(id)
            } : {
                path: data.path
            }, {
                $set: {
                    ...data,
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
