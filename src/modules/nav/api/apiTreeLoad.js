export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
        } = req.zoia;
        try {
            // Check permissions
            if (!auth.checkStatus("admin")) {
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
