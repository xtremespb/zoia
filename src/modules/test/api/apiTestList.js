import testListData from "./data/testList.json";

const findNodeByUUID = (uuid, data) => {
    let node;
    data.map(i => {
        if (i.uuid === uuid) {
            node = i;
        }
        if (!node && i.c) {
            node = findNodeByUUID(uuid, i.c);
        }
    });
    return node;
};

const getLabel = (uuid, language, treeData) => {
    if (!uuid) {
        return "/";
    }
    const node = findNodeByUUID(uuid, treeData);
    return node ? node.data[language] || node.id : null;
};

export default () => ({
    schema: {
        body: testListData.schema
    },
    attachValidation: true,
    async handler(req) {
        const {
            log,
            response,
            auth,
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
        try {
            // Get tree
            const treeData = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "test_data"
            });
            // Get test data
            const langProjection = {};
            Object.keys(req.zoiaConfig.languages).map(i => {
                langProjection[`${i}.title`] = 1;
            });
            const options = {
                sort: {},
                projection: {
                    ...testListData.projection,
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
                query.$or = testListData.search.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.searchText,
                        $options: "i"
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection(req.zoiaModulesConfig["test"].collectionTest).find(query, options).count();
            const limit = req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(req.zoiaModulesConfig["test"].collectionTest).find(query, options).toArray()).map(i => ({
                _id: i._id,
                dir: treeData ? getLabel(i.dir, req.body.language, treeData.tree) || "/" : "/",
                filename: i.filename,
                title: i[req.body.language] ? i[req.body.language].title : ""
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
