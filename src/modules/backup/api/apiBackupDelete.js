import {
    ObjectId
} from "mongodb";
import path from "path";
import fs from "fs-extra";
import backupDelete from "./data/backupDelete.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    schema: {
        body: backupDelete.root
    },
    attachValidation: true,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
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
                    const file = path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["backup"].directory}/${b.filename}.zip`);
                    await fs.remove(file);
                } catch {
                    // Ignore
                }
            }));
            // Delete requested IDs
            const result = await this.mongo.db.collection(req.zoiaModulesConfig["backup"].collectionBackup).deleteMany(query);
            // Check result
            if (!result || !result.result || !result.result.ok) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Could not delete one or more items",
                    errorKeyword: "deleteError",
                    errorData: []
                });
                return;
            }
            // Send "success" result
            rep.successJSON(rep);
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
