import {
    ObjectId
} from "mongodb";
import cloneDeep from "lodash/cloneDeep";
import userEdit from "./data/userEdit.json";

export default () => ({
    async handler(req, rep) {
        const userEditRoot = cloneDeep(userEdit.root);
        userEditRoot.required = ["id"];
        const extendedValidation = new req.ExtendedValidation(req.body, userEditRoot);
        const extendedValidationResult = extendedValidation.validate();
        if (extendedValidationResult.failed) {
            rep.logError(req, extendedValidationResult.message);
            rep.validationError(rep, extendedValidationResult);
            return;
        }
        try {
            const user = await this.mongo.db.collection("users").findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!user) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "userNotFound",
                    errorData: []
                });
                return;
            }
            delete user.password;
            rep.successJSON(rep, {
                data: user
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
