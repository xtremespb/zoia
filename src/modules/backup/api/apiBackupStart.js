import Engine from "./engine";

export default () => ({
    async handler(req) {
        const {
            log,
            response,
            auth,
            acl,
        } = req.zoia;
        // Check permissions
        if (!auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkPermission("backup", "create")) {
            response.requestError({
                failed: true,
                error: "Access Denied",
                errorKeyword: "accessDenied",
                errorData: []
            });
            return;
        }
        try {
            const backupDb = await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "backup"
            });
            if (backupDb && backupDb.running) {
                response.requestError({
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
                            complete: false,
                            errorKeyword: null
                        }
                    }, {
                        upsert: true
                    });
                    const engine = new Engine(this.mongo.db, req.zoiaModulesConfig["backup"], req.zoiaConfig);
                    await engine.backupCollections();
                    await engine.backupDirs();
                    await engine.backupCore();
                    // await engine.backupDataDir();
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
            response.successJSON();
            return;
        } catch (e) {
            try {
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
            } catch {
                // Ignore
            }
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
