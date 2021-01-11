import {
    ObjectId
} from "mongodb";
import cloneDeep from "lodash/cloneDeep";
import crypto from "crypto";
import editData from "./data/edit.json";
import moduleConfig from "../module.json";

export default () => ({
    async handler(req, rep) {
        const {
            log,
            response,
            auth,
            acl
        } = req.zoia;
        // Check permissions
        if (!auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        // Clone root validation schema
        const editRoot = cloneDeep(editData.root);
        if (!req.body.id) {
            // If it's a new record, password is mandatory
            editRoot.required = [...editRoot.required, "password"];
        }
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(req.body, editRoot, editData.part, editData.files, Object.keys(req.zoiaConfig.languages));
        // Perform validation
        const extendedValidationResult = extendedValidation.validate();
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
            if ((!req.body.id && !acl.checkPermission(moduleConfig.id, "create")) || !acl.checkPermission(moduleConfig.id, "update", data.id)) {
                response.requestError({
                    failed: true,
                    error: "Access Denied",
                    errorKeyword: "accessDenied",
                    errorData: []
                });
                return;
            }
            const {
                collectionName
            } = req.zoiaModulesConfig[moduleConfig.id];
            // Check for ID duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, collectionName, {
                    uid: data.uid,
                    _id: {
                        $ne: req.body.id ? new ObjectId(req.body.id) : null
                    }
                }, "alreadyExists", "uid")) {
                return;
            }
            // Check for email duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, collectionName, {
                    email: data.email,
                    _id: {
                        $ne: req.body.id ? new ObjectId(req.body.id) : null
                    }
                }, "emailAlreadyExists", "email")) {
                return;
            }
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
                id: data.id
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
                response.requestError({
                    failed: true,
                    error: "Database error",
                    errorKeyword: "databaseError",
                    errorData: []
                });
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
