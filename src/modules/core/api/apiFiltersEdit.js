import {
    ObjectId
} from "mongodb";
import filterSaveData from "./data/filterEdit.json";

export default () => ({
    schema: {
        body: filterSaveData.root
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkCorePermission("tableSettings")) {
            response.requestAccessDeniedError();
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        try {
            await this.mongo.db.collection(req.zoiaModulesConfig["core"].collectionFilters || "filters").updateOne({
                _id: new ObjectId(req.body.id),
            }, {
                $set: {
                    title: req.body.title,
                    type: req.body.type,
                    userId: String(auth.getUser()._id),
                }
            }, {
                upsert: false,
            });
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
