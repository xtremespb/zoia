import {
    ObjectId
} from "mongodb";
import cloneDeep from "lodash/cloneDeep";
import crypto from "crypto";
import editData from "./data/edit.json";
import moduleConfig from "../module.json";
import utils from "../../../shared/lib/utils";

export default () => ({
    async handler(req, rep) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        const {
            collectionName
        } = req.zoiaModulesConfig[moduleConfig.id];
        const languages = Object.keys(req.zoiaConfig.languages);
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        // Get Form Data
        const formData = await req.processMultipart();
        const id = utils.getFormDataId(formData);
        // Clone root validation schema
        const editRoot = cloneDeep(editData.root);
        if (!id) {
            // If it's a new record, password is mandatory
            editRoot.required = [...editRoot.required, "password"];
        }
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(formData, editRoot, editData.part, editData.files, languages);
        // Perform validation
        const extendedValidationResult = await extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        // Get data from form body
        const data = extendedValidation.getData();
        try {
            // Process case for UID
            data.uid = data.uid.trim().toLowerCase();
            // Check permission
            if ((!id && !acl.checkPermission(moduleConfig.id, "create")) || !acl.checkPermission(moduleConfig.id, "update", data.id)) {
                response.requestAccessDeniedError();
                return;
            }
            // Check for ID duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, collectionName, {
                    uid: data.uid,
                    _id: {
                        $ne: id ? new ObjectId(id) : null
                    }
                }, "alreadyExists", "uid")) {
                return;
            }
            // Get files from body
            const uploadFiles = extendedValidation.getFiles("file");
            const uploadImages = extendedValidation.getFiles("image");
            // Delete files/images which are removed
            if (id) {
                const dbItem = await this.mongo.db.collection(collectionName).findOne({
                    _id: new ObjectId(id)
                });
                await utils.cleanRemovedFiles(req, this.mongo.db, extendedValidation, dbItem, data);
                await utils.cleanRemovedImages(req, this.mongo.db, extendedValidation, dbItem, data);
            }
            // Upload files
            if (uploadFiles && uploadFiles.length && !(await utils.saveFiles(req, rep, this.mongo.db, uploadFiles, formData))) {
                await req.removeMultipartTempFiles(formData.files);
                return;
            }
            // Upload images
            if (uploadImages && uploadImages.length && !(await utils.saveImages(req, rep, this.mongo.db, uploadImages, formData))) {
                await req.removeMultipartTempFiles(formData.files);
                return;
            }
            await req.removeMultipartTempFiles(formData.files);
            // Set password when necessary
            const updateExtras = {};
            if (data.password && data.passwordRepeat) {
                updateExtras.password = crypto.createHmac("sha256", req.zoiaConfig.secret).update(data.password).digest("hex");
            }
            delete data.passwordRepeat;
            delete data.password;
            // Set createdAt timestamp if that's a new record
            if (!data.id) {
                updateExtras.createdAt = new Date();
            }
            // Update database
            const update = await this.mongo.db.collection(collectionName).updateOne(data.id ? {
                _id: new ObjectId(data.id)
            } : {
                uid: data.uid,
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
