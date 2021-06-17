import utils from "../../../shared/lib/utils";
import dataListData from "./data/dataList.json";

export default () => ({
    schema: {
        body: dataListData.schema
    },
    attachValidation: true,
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
            const columns = await utils.getTableSettings(req, this.mongo.db, auth, "registry");
            const limit = columns.itemsPerPage || req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(req.zoiaConfig.collections.registry).find(query, options).toArray()).map(i => ({
                ...i,
                _id: !acl.checkPermission("registry", "read", i.username) ? "***" : i._id
            }));
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
