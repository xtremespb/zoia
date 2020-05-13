import {
    ObjectId
} from "mongodb";
import cloneDeep from "lodash/cloneDeep";
import userEdit from "./data/userEdit.json";

export default () => ({
    async handler(req, rep) {
        const userEditRoot = cloneDeep(userEdit.root);
        if (!req.body.id) {
            userEditRoot.required = [...userEditRoot.required, "password"];
        }
        const extendedValidation = new req.ExtendedValidation(req.body, userEditRoot);
        const extendedValidationResult = extendedValidation.validate();
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        const data = extendedValidation.getData();
        try {
            data.username = data.username.toLowerCase();
            data.email = data.email.toLowerCase();
            const dbUsername = await this.mongo.db.collection("users").findOne({
                username: data.username,
                _id: {
                    $ne: req.body.id ? new ObjectId(req.body.id) : null
                }
            });
            // Check for username duplicates
            if (dbUsername) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "userAlreadyExists",
                    errorData: [{
                        keyword: "userAlreadyExists",
                        dataPath: `.username`
                    }]
                });
                return;
            }
            const dbEmail = await this.mongo.db.collection("users").findOne({
                email: data.email,
                _id: {
                    $ne: req.body.id ? new ObjectId(req.body.id) : null
                }
            });
            // Check for username duplicates
            if (dbEmail) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "emailAlreadyExists",
                    errorData: [{
                        keyword: "emailAlreadyExists",
                        dataPath: `.email`
                    }]
                });
                return;
            }
            rep.successJSON(rep);
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
