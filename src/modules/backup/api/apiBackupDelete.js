import {
    ObjectId
} from "mongodb";
import path from "path";
import fs from "fs-extra";
import backupDelete from "./data/backupDelete.json";

export default () => ({
    schema: {
        body: backupDelete.root,
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
        if (!auth.checkStatus("admin")) {
            response.unauthorizedError();
            return;
        }
        if (!acl.checkPermission("backup", "delete")) {
            response.requestError({
                failed: true,
                error: "Access Denied",
                errorKeyword: "accessDenied",
                errorData: []
            });
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError.message);
            response.validationError(req.validationError);
            return;
        }
        try {
            // Build query
            const query = {
                $or: req.body.ids.map(id => ({
                    _id: new ObjectId(id)
                }))
            };
            // Get list of records
            const backups = await this.mongo.db.collection(req.zoiaModulesConfig["backup"].collectionBackup).find(query).toArray();
            await Promise.allSettled(backups.map(async b => {
                try {
                    const file = path.resolve(`${__dirname}/../../${this.zoiaConfig.directories.files}/${req.zoiaModulesConfig["backup"].directory}/${b.filename}.zip`);
                    await fs.remove(file);
                } catch {
                    // Ignore
                }
            }));
            // Delete requested IDs
            const result = await this.mongo.db.collection(req.zoiaModulesConfig["backup"].collectionBackup).deleteMany(query);
            // Check result
            if (!result || !result.result || !result.result.ok) {
                response.requestError({
                    failed: true,
                    error: "Could not delete one or more items",
                    errorKeyword: "deleteError",
                    errorData: []
                });
                return;
            }
            // Send "success" result
            response.successJSON();
            return;
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
