import cloneDeep from "lodash/cloneDeep";
import templateRaw from "./raw.marko";
import templatePM from "./pm.marko";

const findNodeById = (id, data) => {
    let node;
    data.map(i => {
        if (i.id === id) {
            node = i;
        }
    });
    return node;
};

const getUUIDByPath = (path, tree) => {
    let uuid = null;
    let data = tree;
    path.map((p, i) => {
        if (!data || !data.length) {
            return;
        }
        const node = findNodeById(p, data);
        if (!uuid && node && data && path.length - 1 === i) {
            uuid = node.uuid;
        }
        data = node && node.c ? node.c : null;
    });
    return uuid;
};

export default () => ({
    async handler(req, rep) {
        const log = new this.LoggerHelpers(req, this);
        try {
            const {
                response,
                auth,
            } = req.zoia || {};
            const site = new req.ZoiaSite(req, "pages", this.mongo.db);
            if (response && auth) {
                response.setSite(site);
                await auth.getUserData();
                site.setAuth(auth);
            }
            const {
                url
            } = site.i18n.getNonLocalizedURL(req);
            const treeData = (await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "pages_data"
            })) || {};
            const urlItems = url.split("/").filter(i => i);
            let query;
            if (urlItems.length) {
                const dir1 = cloneDeep(urlItems);
                const dir2 = cloneDeep(urlItems).slice(0, -1);
                const uuid1 = getUUIDByPath(dir1, treeData.tree);
                const uuid2 = getUUIDByPath(dir2, treeData.tree);
                query = uuid1 || uuid2 ? {
                    $or: [{
                            dir: uuid1,
                            filename: ""
                        },
                        {
                            dir: uuid2,
                            filename: urlItems[urlItems.length - 1]
                        }
                    ]
                } : {
                    dir: "",
                    filename: urlItems[urlItems.length - 1]
                };
            } else {
                query = {
                    dir: "",
                    filename: ""
                };
            }
            const projection = {
                dir: 1,
                filename: 1,
                createdAt: 1,
                modifiedAt: 1,
                engine: 1,
            };
            ["title", "contentMin", "cssMin", "jsMin", "pm"].map(i => projection[`${site.language}.${i}`] = 1);
            const page = await this.mongo.db.collection(this.zoiaModulesConfig["pages"].collectionPages).findOne(query, {
                projection
            });
            if (!page || !page[site.language]) {
                rep.callNotFound();
                return rep.code(204);
            }
            let render;
            switch (page.engine) {
            case "pm":
                render = await templatePM.stream({
                    $global: {
                        serializedGlobals: {
                            template: true,
                            pageTitle: true,
                            ...site.getSerializedGlobals()
                        },
                        template: req.zoiaTemplates[0],
                        pageTitle: page[site.language].title,
                        ...await site.getGlobals()
                    },
                    content: page[site.language].pm,
                });
                break;
            default:
                render = await templateRaw.stream({
                    $global: {
                        serializedGlobals: {
                            template: true,
                            pageTitle: true,
                            extraCSS: true,
                            extraJS: true,
                            ...site.getSerializedGlobals()
                        },
                        template: req.zoiaTemplates[0],
                        pageTitle: page[site.language].title,
                        extraCSS: page[site.language].cssMin,
                        extraJS: page[site.language].jsMin,
                        ...await site.getGlobals()
                    },
                    content: page[site.language].contentMin
                });
                break;
            }
            return response.sendHTML(render);
        } catch (e) {
            log.error(e);
            return Promise.reject(e);
        }
    }
});
