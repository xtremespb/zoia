import {
    ObjectId
} from "mongodb";
import cloneDeep from "lodash/cloneDeep";
import crypto from "crypto";
import Auth from "../../../shared/lib/auth";
import userEdit from "./data/userEdit.json";
import C from "../../../shared/lib/constants";

export default fastify => ({
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, fastify, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Clone root validation schema
        const userEditRoot = cloneDeep(userEdit.root);
        if (!req.body.id) {
            // If it's a new record, password is mandatory
            userEditRoot.required = [...userEditRoot.required, "password"];
        }
        // Initialize validator
        const extendedValidation = new req.ExtendedValidation(req.body, userEditRoot);
        // Perform validation
        const extendedValidationResult = extendedValidation.validate();
        // Check if there are any validation errors
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        // Get data from form body
        const data = extendedValidation.getData();
        try {
            // Process case for username and e-mail
            data.username = data.username.trim().toLowerCase();
            data.email = data.email.trim().toLowerCase();
            // Check for username duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaConfig.collectionUsers, {
                    username: data.username,
                    _id: {
                        $ne: req.body.id ? new ObjectId(req.body.id) : null
                    }
                }, "userAlreadyExists", "username")) {
                return;
            }
            // Check for email duplicates
            if (await rep.checkDatabaseDuplicates(rep, this.mongo.db, req.zoiaConfig.collectionUsers, {
                    email: data.email,
                    _id: {
                        $ne: req.body.id ? new ObjectId(req.body.id) : null
                    }
                }, "emailAlreadyExists", "email")) {
                return;
            }
            // Set password when necessary
            const updateExtras = {};
            if (data.password) {
                updateExtras.password = crypto.createHmac("sha256", req.zoiaConfig.secret).update(data.password).digest("hex");
            }
            // Set createdAt timestamp if that's a new record
            if (!data.id) {
                updateExtras.createdAt = new Date();
            }
            // Update database
            const update = await this.mongo.db.collection(req.zoiaConfig.collectionUsers).updateOne(data.id ? {
                _id: new ObjectId(data.id)
            } : {
                username: data.username
            }, {
                $set: {
                    username: data.username,
                    email: data.email,
                    status: data.status,
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
