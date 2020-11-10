import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const log = new this.LoggerHelpers(req, this);
        const response = new this.Response(req, rep);
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        try {
            const backupDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "backup"
            });
            if (!backupDb && !backupDb.running) {
                response.requestError({
                    failed: true,
                    error: "Backup process is not started",
                    errorKeyword: "backupNotStarted",
                    errorData: []
                });
                return;
            }
            await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                _id: "backup"
            }, {
                $set: {
                    running: false
                }
            }, {
                upsert: true
            });
            // Send response
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
