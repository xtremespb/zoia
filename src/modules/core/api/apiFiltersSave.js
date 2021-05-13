import {
    ObjectID
} from "mongodb";
import filterSaveData from "./data/filterSave.json";

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
        } = req.zoia;
        // Check permissions
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError ? req.validationError.message : "Request Error");
            response.validationError(req.validationError || {});
            return;
        }
        try {
            if (req.body.id) {
                await this.mongo.db.collection(req.zoiaModulesConfig["core"].collectionFilters || "filters").updateOne({
                    _id: new ObjectID(req.body.id),
                }, {
                    $set: {
                        filters: req.body.filters,
                    }
                }, {
                    upsert: false,
                });
                response.successJSON({});
            } else {
                const result = await this.mongo.db.collection(req.zoiaModulesConfig["core"].collectionFilters || "filters").insertOne({
                    table: req.body.table,
                    type: req.body.type,
                    title: req.body.title,
                    filters: req.body.filters,
                    userId: String(auth.getUser()._id),
                });
                const id = result.insertedId;
                response.successJSON({
                    id
                });
            }
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
