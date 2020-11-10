import Auth from "../../../shared/lib/auth";
import dataListData from "./data/dataList.json";
import C from "../../../shared/lib/constants";

export default () => ({
    schema: {
        body: dataListData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        const response = new this.Response(req, rep);
        const log = new this.LoggerHelpers(req, this);
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError.message);
            response.validationError(req.validationError);
            return;
        }
        try {
            const options = {
                sort: {},
                projection: dataListData.projection
            };
            const query = {};
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = dataListData.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(req.zoiaConfig.collections.registry).find(query, options).count();
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = await this.mongo.db.collection(req.zoiaConfig.collections.registry).find(query, options).toArray();
            // Send response
            response.successJSON({
                data,
                count,
                limit,
                pagesCount: Math.ceil(count / limit)
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
