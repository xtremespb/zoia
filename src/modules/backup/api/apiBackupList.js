import utils from "../../../shared/lib/utils";
import backupList from "./data/backupList.json";

export default () => ({
    schema: {
        body: backupList.schema
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
        if (!acl.checkPermission("backup", "read")) {
            response.requestAccessDeniedError();
            return;
        }
        try {
            const options = {
                sort: {},
                projection: backupList.projection
            };
            const query = {};
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = backupList.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const columns = await utils.getTableSettings(req, this.mongo.db, auth, "backup");
            const count = await this.mongo.db.collection(req.zoiaModulesConfig["backup"].collectionBackup).countDocuments(query);
            const limit = columns.itemsPerPage || req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = await this.mongo.db.collection(req.zoiaModulesConfig["backup"].collectionBackup).find(query, options).toArray();
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
