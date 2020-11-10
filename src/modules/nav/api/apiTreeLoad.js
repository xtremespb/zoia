import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const response = new this.Response(req, rep);
        const log = new this.LoggerHelpers(req, this);
        try {
            // Check permissions
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                response.unauthorizedError();
                return;
            }
            // Get tree
            const treeData = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "nav_data"
            });
            const tree = {
                id: "/",
                c: treeData ? treeData.tree : []
            };
            // Send result
            response.successJSON({
                tree
            });
            return;
        } catch (e) {
            log.error(e);
            // eslint-disable-next-line consistent-return
            return Promise.reject(e);
        }
    }
});
