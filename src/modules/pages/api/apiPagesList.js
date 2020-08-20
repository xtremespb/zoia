import Auth from "../../../shared/lib/auth";
import pagesListData from "./data/pagesList.json";
import C from "../../../shared/lib/constants";

export default () => ({
    schema: {
        body: pagesListData.schema
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
            const langProjection = {};
            Object.keys(req.zoiaConfig.languages).map(i => {
                langProjection[`${i}.title`] = 1;
            });
            const options = {
                sort: {},
                projection: {
                    ...pagesListData.projection,
                    ...langProjection
                }
            };
            req.body.sortId = req.body.sortId === "title" ? `${req.body.language}.${req.body.sortId}` : req.body.sortId;
            const query = {};
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = pagesListData.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).find(query, options).count();
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).find(query, options).toArray()).map(i => ({
                _id: i._id,
                path: i.path,
                title: i[req.body.language] ? i[req.body.language].title : ""
            }));
            // Send response
            rep.successJSON(rep, {
                data,
                count,
                limit,
                pagesCount: Math.ceil(count / limit),
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
