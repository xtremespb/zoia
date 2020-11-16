import cloneDeep from "lodash/cloneDeep";
import dataEdit from "./data/dataEdit.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const response = new this.Response(req, rep);
        const log = new this.LoggerHelpers(req, this);
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        const dataEditRoot = cloneDeep(dataEdit.root);
        dataEditRoot.required = ["id"];
        const extendedValidation = new req.ExtendedValidation(req.body, dataEditRoot);
        const extendedValidationResult = extendedValidation.validate();
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
                response.requestError({
                    failed: true,
                    error: "Database error",
                    errorKeyword: "dataNotFound",
                    errorData: []
                });
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