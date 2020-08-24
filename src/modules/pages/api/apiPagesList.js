import Auth from "../../../shared/lib/auth";
import pagesListData from "./data/pagesList.json";
import C from "../../../shared/lib/constants";

const findNodeById = (id, data) => {
    let node;
    data.map(i => {
        if (i.id === id) {
            node = i;
        }
    });
    return node;
};

const getPathLabel = (path, language, treeData) => {
    let data = treeData;
    let label = "";
    path.map((p, i) => {
        if (!data || !data.length) {
            return;
        }
        const node = findNodeById(p, data);
        if (node && data && path.length - 1 === i) {
            label = node.data[language] || node.id;
        }
        data = node && node.c ? node.c : null;
    });
    return label;
};

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
            // Get tree
            const treeData = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "pages_data"
            });
            // Get pages data
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
            switch (req.body.sortId) {
            case "title":
                req.body.sortId = `${req.body.language}.${req.body.sortId}`;
                break;
            case "dir":
                req.body.sortId = "dirString";
            }
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
            if (typeof req.body.dir === "string") {
                query.dirString = req.body.dir;
            }
            const count = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).find(query, options).count();
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).find(query, options).toArray()).map(i => ({
                _id: i._id,
                dir: getPathLabel(i.dir, req.body.language, treeData.tree) || i.dirString || "/",
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
