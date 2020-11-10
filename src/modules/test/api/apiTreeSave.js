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
        const response = new this.Response(req, rep); const log = new this.LoggerHelpers(req, this);
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError.message);
            response.validationError(req.validationError);
            return;
        }
        try {
            // Check permissions
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                response.unauthorizedError();
                return;
            }
            const treeExisting = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "test_data"
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
                _id: "test_data"
            }, {
                $set: {
                    tree: treeNew
                }
            }, {
                upsert: true
            });
            if (!resultTree || !resultTree.result || !resultTree.result.ok) {
                response.requestError({
                    failed: true,
                    error: "Could not update one or more items",
                    errorKeyword: "couldNotProcess",
                    errorData: []
                });
                return;
            }
            // Update items with removed nodes
            // We will make them "root" items to they won't become orphans
            if (removedNodes.length) {
                const resultTest = await this.mongo.db.collection(req.zoiaModulesConfig["test"].collectionTest).updateMany({
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
                if (!resultTest || !resultTest.result || !resultTest.result.ok) {
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
