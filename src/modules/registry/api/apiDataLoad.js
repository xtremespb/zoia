import cloneDeep from "lodash/cloneDeep";
import dataEdit from "./data/dataEdit.json";

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
        // Data
        const dataEditRoot = cloneDeep(dataEdit.root);
        dataEditRoot.required = ["id"];
        const extendedValidation = new req.ExtendedValidation(req.body, dataEditRoot);
        const extendedValidationResult = await extendedValidation.validate();
        if (extendedValidationResult.failed) {
            log.error(null, extendedValidationResult.message);
            response.validationError(extendedValidationResult);
            return;
        }
        try {
            const data = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: req.body.id
            });
            if (!data) {
                response.databaseError("dataNotFound");
                return;
            }
            // Check permission
            if (!acl.checkPermission("registry", "read", data._id)) {
                response.requestAccessDeniedError();
                return;
            }
            const valueData = cloneDeep(data);
            delete valueData._id;
            response.successJSON({
                data: {
                    _id: data._id,
                    value: JSON.stringify(valueData, null, "\t")
                }
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
