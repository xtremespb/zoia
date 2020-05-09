import usersListData from "./data/usersList.json";

export default () => ({
    schema: {
        body: usersListData.schema
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
                projection: usersListData.projection
            };
            const query = {};
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = usersListData.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(usersListData.collection).find(query, options).count();
            options.limit = req.zoiaConfig.commonTableItemsLimit;
            options.skip = (req.body.page - 1) * req.zoiaConfig.commonTableItemsLimit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = await this.mongo.db.collection(usersListData.collection).find(query, options).toArray();
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
