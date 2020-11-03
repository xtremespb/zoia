import cloneDeep from "lodash/cloneDeep";
import treeSave from "./data/treeSave.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

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
    async handler(req, rep) {
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        try {
            // Check permissions
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                rep.unauthorizedError(rep);
                return;
            }
            const treeExisting = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "yachts_data"
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
            // Save tree to the database
            const resultTree = await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                _id: "yachts_data"
            }, {
                $set: {
                    tree: treeNew
                }
            }, {
                upsert: true
            });
            if (!resultTree || !resultTree.result || !resultTree.result.ok) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Could not update one or more items",
                    errorKeyword: "couldNotProcess",
                    errorData: []
                });
                return;
            }
            // Update yachts with removed nodes
            // We will make them "root" yachts to they won't become orphans
            if (removedNodes.length) {
                const resultYachts = await this.mongo.db.collection(req.zoiaModulesConfig["yachts"].collectionYachts).updateMany({
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
                if (!resultYachts || !resultYachts.result || !resultYachts.result.ok) {
                    rep.requestError(rep, {
                        failed: true,
                        error: "Could not update one or more items",
                        errorKeyword: "couldNotProcess",
                        errorData: []
                    });
                    return;
                }
            }
            // Send result
            rep.successJSON(rep, {});
            return;
        } catch (e) {
            rep.logError(req, null, e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
