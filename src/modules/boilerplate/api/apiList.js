import utils from "../../../shared/lib/utils";
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
            collectionName
        } = req.zoiaModulesConfig[moduleConfig.id];
        try {
            const langProjection = {};
            Object.keys(req.zoiaConfig.languages).map(i => {
                langProjection[`${i}.title`] = 1;
            });
            const options = {
                sort: {},
                projection: {
                    ...listData.projection,
                    ...langProjection
                }
            };
            switch (req.body.sortId) {
            case "title":
                req.body.sortId = `${req.body.language}.${req.body.sortId}`;
                break;
            }
            const query = {
                deletedAt: {
                    $eq: null
                }
            };
            if (req.body.searchText && req.body.searchText.length > 1) {
                query.$or = [];
                listData.search.map(c => {
                    if (c.match(/\[language\]/i)) {
                        Object.keys(req.zoiaConfig.languages).map(lang => {
                            const sr = {};
                            const key = c.replace(/\[language\]/i, lang);
                            sr[key] = {
                                $regex: req.body.searchText,
                                $options: "i"
                            };
                            query.$or.push(sr);
                        });
                    } else {
                        const sr = {};
                        sr[c] = {
                            $regex: req.body.searchText,
                            $options: "i"
                        };
                        query.$or.push(sr);
                    }
                });
            }
            const count = await this.mongo.db.collection(collectionName).countDocuments(query);
            const columns = await utils.getTableSettings(req, this.mongo.db, auth, moduleConfig.id);
            const limit = columns.itemsPerPage || req.body.itemsPerPage || req.zoiaConfig.commonTableItemsLimit;
            options.limit = limit;
            options.skip = (req.body.page - 1) * limit;
            options.sort[req.body.sortId] = req.body.sortDirection === "asc" ? 1 : -1;
            const data = (await this.mongo.db.collection(collectionName).find(query, options).toArray()).map(i => ({
                ...i,
                uid: !acl.checkPermission(moduleConfig.id, "read", i.uid) ? "***" : i.uid,
                title: !acl.checkPermission(moduleConfig.id, "read", i.uid) ? "***" : i[req.body.language] ? i[req.body.language].title : "",
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
