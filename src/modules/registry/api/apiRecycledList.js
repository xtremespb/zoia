import recycledListData from "./data/recycledList.json";
import moduleConfig from "../module.json";

export default () => ({
    schema: {
        body: recycledListData.schema
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
                projection: recycledListData.projection
            };
            const query = {
                deletedAt: { $ne: null },
            };
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = recycledListData.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(req.zoiaConfig.collections.registry).countDocuments(query);
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(req.zoiaConfig.collections.registry).find(query, options).toArray()).map(i => ({
                _id: String(i._id),
                deletedAt: !acl.checkPermission(moduleConfig.id, "read", i.deletedAt) ? "***" : i.deletedAt,
                title: i._id,
            }));
            // Send response
            response.successJSON({
                data,
                count,
                limit,
                pagesCount: Math.ceil(count / limit),
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
