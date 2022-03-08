import aclListData from "./data/aclRecycledList.json";

export default () => ({
    schema: {
        body: aclListData.schema
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
        const {
            collectionAcl
        } = req.zoiaModulesConfig["users"];
        try {
            const options = {
                sort: {},
                projection: aclListData.projection
            };
            const query = {
                deletedAt: { $ne: null },
            };
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = aclListData.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(collectionAcl).countDocuments(query);
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(collectionAcl).find(query, options).toArray()).map(i => ({
                _id: String(i._id),
                deletedAt: !acl.checkPermission("users", "read", i.deletedAt) ? "***" : i.deletedAt,
                title: !acl.checkPermission("users", "read", i.group) ? "***" : i.group,
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
