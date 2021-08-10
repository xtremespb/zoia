import cloneDeep from "lodash/cloneDeep";
import treeSave from "./data/treeSave.json";

const filterTree = data => data.map(i => {
    const item = {
        id: i.id,
        uuid: i.uuid,
        data: i.data,
        checksum: i.checksum
    };
    if (i.c) {
        item.c = filterTree(i.c);
    }
    return item;
});

const flatTree = tree => {
    let flat = [];
    tree.map(n => {
        if (n.c) {
            flat = [...flat, ...flatTree(n.c)];
            delete n.c;
        }
        flat.push(n);
    });
    return flat;
};

export default () => ({
    schema: {
        body: treeSave.root
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
            // Get existing tree
            const treeExisting = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "pages_data"
            });
            const treeNew = filterTree(req.body.tree);
            // Check if any nodes are removed
            const removedNodes = [];
            if (treeExisting && treeExisting.tree) {
                const treeEx = flatTree(cloneDeep(treeExisting.tree));
                const treeNe = flatTree(cloneDeep(treeNew));
                treeEx.map(n => {
                    if (!treeNe.find(nn => n.uuid === nn.uuid)) {
                        removedNodes.push(n.uuid);
                    }
                });
            }
            if ((!treeExisting && !acl.checkPermission("pages", "create")) || !acl.checkPermission("pages", "update")) {
                response.requestAccessDeniedError();
                return;
            }
            // Save tree to the database
            const resultTree = await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                _id: "pages_data"
            }, {
                $set: {
                    tree: treeNew
                }
            }, {
                upsert: true
            });
            if (!resultTree || !resultTree.acknowledged) {
                response.requestError({
                    failed: true,
                    error: "Could not update one or more items",
                    errorKeyword: "couldNotProcess",
                    errorData: []
                });
                return;
            }
            // Update pages with removed nodes
            // We will make them "root" pages to they won't become orphans
            if (removedNodes.length) {
                const resultPages = await this.mongo.db.collection(req.zoiaModulesConfig["pages"].collectionPages).updateMany({
                    $or: removedNodes.map(dir => ({
                        dir
                    }))
                }, {
                    $set: {
                        dir: ""
                    }
                }, {
                    upsert: false
                });
                // Check result
                if (!!resultPages || !resultPages.acknowledged) {
                    response.requestError({
                        failed: true,
                        error: "Could not update one or more items",
                        errorKeyword: "couldNotProcess",
                        errorData: []
                    });
                    return;
                }
            }
            // Send result
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
