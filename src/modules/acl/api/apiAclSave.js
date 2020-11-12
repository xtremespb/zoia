import {
    ObjectId
} from "mongodb";
import cloneDeep from "lodash/cloneDeep";
import Auth from "../../../shared/lib/auth";
import aclEdit from "./data/aclEdit.json";
import C from "../../../shared/lib/constants";

export default () => ({
    attachValidation: false,
    async handler(req, rep) {
        const response = new this.Response(req, rep);
        const log = new this.LoggerHelpers(req, this);
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        // Initialize validator
        const formData = await req.processMultipart();
        const root = cloneDeep(aclEdit.root);
        // Extend validation with modules
        const moduleProperties = {};
        this.zoiaModules.map(m => {
            moduleProperties[`${m.id}_access`] = {
                type: "array",
                items: {
                    type: "string",
                    enum: ["create", "read", "update", "delete"]
                },
                minItems: 0,
                uniqueItems: true
            };
            moduleProperties[`${m.id}_whitelist`] = {
                type: "array",
                items: {
                    type: "string",
                    pattern: "^[a-zA-Z0-9_-]+$",
                    minLength: 0,
                    maxLength: 32
                },
                uniqueItems: true
            };
            moduleProperties[`${m.id}_blacklist`] = {
                type: "array",
                items: {
                    type: "string",
                    pattern: "^[a-zA-Z0-9_-]+$",
                    minLength: 0,
                    maxLength: 32
                },
                uniqueItems: true
            };
        });
        root.properties = {
            ...root.properties,
            ...moduleProperties
        };
        // Get extended validation
        const extendedValidation = new req.ExtendedValidation(formData, root, aclEdit.part, aclEdit.files, Object.keys(req.zoiaConfig.languages));
        // Perform validation
        const extendedValidationResult = extendedValidation.validate();
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
            const dataRaw = extendedValidation.getData();
            const data = extendedValidation.filterDataFiles(dataRaw);
            // Check for path duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaModulesConfig["acl"].collectionAcl, {
                    group: data.group || "",
                    _id: {
                        $ne: id ? new ObjectId(id) : null
                    }
                }, "groupAlreadyExists", "path")) {
                return;
            }
            await req.removeMultipartTempFiles(formData.files);
            // Process case and trim
            data.group = data.group && typeof data.group === "string" ? data.group.trim().toLowerCase() : "";
            // Extras
            const updateExtras = {};
            // Set createdAt timestamp if that's a new record
            if (!id) {
                updateExtras.createdAt = new Date();
            }
            // Update database
            const update = await this.mongo.db.collection(req.zoiaModulesConfig["acl"].collectionAcl).updateOne(id ? {
                _id: new ObjectId(id)
            } : {
                group: data.group || "",
            }, {
                $set: {
                    ...data,
                    group: data.group || "",
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
