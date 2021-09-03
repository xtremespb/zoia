import {
    ObjectId
} from "mongodb";
import utils from "../../../shared/lib/utils";
import pageEditPostmodern from "./data/pageEditPostmodern.json";

export default () => ({
    attachValidation: false,
    async handler(req, rep) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        // Initialize validator
        const formData = await req.processMultipart();
        const extendedValidation = new req.ExtendedValidation(formData, pageEditPostmodern.root, pageEditPostmodern.part, pageEditPostmodern.files, Object.keys(req.zoiaConfig.languages));
        // Perform validation
        const extendedValidationResult = await extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        // Get ID from body
        try {
            const id = formData.fields.id && typeof formData.fields.id === "string" && formData.fields.id.match(/^[a-f0-9]{24}$/) ? formData.fields.id : undefined;
            // Get data from form body
            const dataPostmodern = extendedValidation.getData();
            const data = extendedValidation.filterDataFiles(dataPostmodern);
            // Check permission
            if ((!id && !acl.checkPermission("pages", "create")) || !acl.checkPermission("pages", "update", data.filename)) {
                response.requestAccessDeniedError();
                return;
            }
            // Check for path duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaModulesConfig["pages"].collectionPages, {
                    dir: data.dir || "",
                    filename: data.filename || "",
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
                const dbItem = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).findOne({
                    _id: new ObjectId(id)
                });
                await utils.cleanRemovedFiles(req, this.mongo.db, extendedValidation, dbItem, data);
            }
            // Upload files
            if (uploadFiles && uploadFiles.length && !(await utils.saveFiles(req, rep, this.mongo.db, uploadFiles, formData))) {
                await req.removeMultipartTempFiles(formData.files);
                return;
            }
            await req.removeMultipartTempFiles(formData.files);
            // Process case and trim
            data.filename = data.filename && typeof data.filename === "string" ? data.filename.trim().toLowerCase() : "";
            // Extras
            const updateExtras = {};
            // Set createdAt timestamp if that's a new record
            if (!id) {
                updateExtras.createdAt = new Date();
            }
            // Update database
            const update = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).updateOne(id ? {
                _id: new ObjectId(id)
            } : {
                dir: data.dir || "",
                filename: data.filename || "",
            }, {
                $set: {
                    ...data,
                    engine: "pm",
                    dir: data.dir || "",
                    filename: data.filename || "",
                    modifiedAt: new Date(),
                    ...updateExtras
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.acknowledged) {
                response.databaseError();
                return;
            }
            // Return "success" result
            response.successJSON();
            return;
        } catch (e) {
            // There is an exception, send error 500 as response
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
