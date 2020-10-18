import Auth from "../../../shared/lib/auth";
import filesList from "./data/filesList.json";
import C from "../../../shared/lib/constants";

export default () => ({
    schema: {
        body: filesList.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        try {
            const options = {
                sort: {},
                projection: filesList.projection
            };
            const query = {};
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = filesList.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(req.zoiaModulesConfig["cm"].collectionCmFiles).find(query, options).count();
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = await this.mongo.db.collection(req.zoiaModulesConfig["cm"].collectionCmFiles).find(query, options).toArray();
            // Send response
            rep.successJSON(rep, {
                data,
                count,
                limit,
                pagesCount: Math.ceil(count / limit)
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
