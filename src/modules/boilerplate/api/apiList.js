import listData from "./data/list.json";
import moduleConfig from "../module.json";

export default () => ({
    schema: {
        body: listData.schema
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
        if (!auth.checkStatus("admin")) {
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
            collectionName
        } = req.zoiaModulesConfig[moduleConfig.id];
        try {
            const options = {
                sort: {},
                projection: listData.projection
            };
            const query = {};
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = listData.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(collectionName).find(query, options).count();
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(collectionName).find(query, options).toArray()).map(i => ({
                ...i,
                uid: !acl.checkPermission(moduleConfig.id, "read", i.uid) ? "***" : i.uid,
                title: !acl.checkPermission(moduleConfig.id, "read", i.uid) ? "***" : i.title,
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
