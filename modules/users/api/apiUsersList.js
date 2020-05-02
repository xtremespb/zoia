import schemaUsersList from "./schemaUsersList.json";
import projectionUsersList from "./projectionUsersList.json";

export default () => ({
    schema: {
        body: schemaUsersList
    },
    attachValidation: true,
    async handler(req, rep) {
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        try {
            const options = {
                sort: {},
                projection: projectionUsersList
            };
            const query = {};
            const count = await this.mongo.db.collection("users").find(query, options).count();
            options.limit = req.zoiaConfig.commonTableItemsLimit;
            options.skip = (req.body.page - 1) * req.zoiaConfig.commonTableItemsLimit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = await this.mongo.db.collection("users").find(query, options).toArray();
            // Send response
            rep.successJSON(rep, {
                data,
                count,
                limit: req.zoiaConfig.commonTableItemsLimit,
                pagesCount: Math.ceil(count / req.zoiaConfig.commonTableItemsLimit)
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
