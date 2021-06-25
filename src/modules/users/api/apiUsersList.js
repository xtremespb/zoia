import utils from "../../../shared/lib/utils";
import usersListData from "./data/usersList.json";

export default () => ({
    schema: {
        body: usersListData.schema
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
            collectionUsers
        } = req.zoiaModulesConfig["users"];
        try {
            const options = {
                sort: {},
                projection: usersListData.projection
            };
            let query = {};
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
            if (req.body.filters && Array.isArray(req.body.filters) && req.body.filters.length) {
                const builtQuery = utils.buildFilterQuery(req.body.filters);
                if (Object.keys(builtQuery).length) {
                    query = {
                        ...query,
                        ...builtQuery
                    };
                }
            }
            const widgets = await utils.getWidgets(req, this.mongo.db, "users", collectionUsers);
            const columns = await utils.getTableSettings(req, this.mongo.db, auth, "users");
            const count = await this.mongo.db.collection(collectionUsers).find(query, options).count();
            let limit = columns.itemsPerPage || req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            if (req.body.autoItemsPerPage && widgets.config.length) {
                limit -= 2;
            }
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(collectionUsers).find(query, options).toArray()).map(i => ({
                ...i,
                username: !acl.checkPermission("users", "read", i.username) ? "***" : i.username,
                displayName: !acl.checkPermission("users", "read", i.displayName) ? "***" : i.displayName,
                email: !acl.checkPermission("users", "read", i.username) ? "***" : i.email,
            }));
            // Send response
            response.successJSON({
                data,
                count,
                limit,
                pagesCount: Math.ceil(count / limit),
                columns,
                widgets,
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
