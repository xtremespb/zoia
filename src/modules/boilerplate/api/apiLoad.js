import {
    ObjectId
} from "mongodb";
import cloneDeep from "lodash/cloneDeep";
import editData from "./data/edit.json";
import moduleConfig from "../module.json";

export default () => ({
    async handler(req) {
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
        const {
            collectionName
        } = req.zoiaModulesConfig[moduleConfig.id];
        const editRoot = cloneDeep(editData.root);
        editRoot.required = ["id"];
        const extendedValidation = new req.ExtendedValidation(req.body, editRoot);
        const extendedValidationResult = await extendedValidation.validate();
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        try {
            const data = await this.mongo.db.collection(collectionName).findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!data) {
                response.databaseError("dataNotFound");
                return;
            }
            // Check permission
            if (!acl.checkPermission(moduleConfig.id, "read", data.uid)) {
                response.requestAccessDeniedError();
                return;
            }
            delete data.password;
            delete data.passwordRepeat;
            response.successJSON({
                data
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
