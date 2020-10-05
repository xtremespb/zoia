import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import Engine from "./engine";

export default () => ({
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        try {
            const backupDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "backup"
            });
            if (backupDb && backupDb.running) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Backup process is already running",
                    errorKeyword: "alreadyRunning",
                    errorData: []
                });
                return;
            }
            setTimeout(async () => {
                try {
                    await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                        _id: "backup"
                    }, {
                        $set: {
                            running: true,
                            complete: false
                        }
                    }, {
                        upsert: true
                    });
                    const engine = new Engine(this.mongo.db, req.zoiaModulesConfig["backup"]);
                    await engine.backupCollections();
                    await engine.backupDirs();
                    await engine.backupCore();
                    await engine.saveData();
                    const filename = await engine.saveBackup();
                    await engine.cleanUp();
                    // Insert record into backup collection
                    await this.mongo.db.collection(req.zoiaModulesConfig["backup"].collectionBackup).insertOne({
                        filename,
                        timestamp: new Date()
                    });
                    // Set queue status
                    await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                        _id: "backup"
                    }, {
                        $set: {
                            running: false,
                            complete: true
                        }
                    }, {
                        upsert: true
                    });
                } catch (e) {
                    await this.mongo.db.collection(req.zoiaConfig.collections.registry).updateOne({
                        _id: "backup"
                    }, {
                        $set: {
                            running: false,
                            complete: false,
                            errorKeyword: e.message
                        }
                    }, {
                        upsert: true
                    });
                }
            }, 0);
            // Send response
            rep.successJSON(rep, {});
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
