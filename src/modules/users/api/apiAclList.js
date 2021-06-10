import utils from "../../../shared/lib/utils";
import aclListData from "./data/aclList.json";

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
        try {
            // Get acl data
            const langProjection = {};
            Object.keys(req.zoiaConfig.languages).map(i => {
                langProjection[`${i}.comment`] = 1;
            });
            const options = {
                sort: {},
                projection: {
                    ...aclListData.projection,
                    ...langProjection
                }
            };
            switch (req.body.sortId) {
            case "title":
                req.body.sortId = `${req.body.language}.${req.body.sortId}`;
                break;
            }
            const query = {
                dir: req.body.dir
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
            const count = await this.mongo.db.collection(req.zoiaModulesConfig["users"].collectionAcl).find(query, options).count();
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const columns = await utils.getColumnsConfig(req, this.mongo.db, auth, "acl");
            const data = (await this.mongo.db.collection(req.zoiaModulesConfig["users"].collectionAcl).find(query, options).toArray()).map(i => ({
                _id: i._id,
                group: !acl.checkPermission("users", "read", i.group) ? "***" : i.group,
                comment: i.comment || ""
            }));
            // Send response
            response.successJSON({
                data,
                count,
                limit,
                pagesCount: Math.ceil(count / limit),
                columns,
            });
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
