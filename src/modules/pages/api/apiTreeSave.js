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
            await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                _id: "pages_data"
            }, {
                $set: {
                    tree: filterTree(req.body.tree)
                }
            }, {
                upsert: true
            });
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
