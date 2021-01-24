import {
    ObjectId
} from "mongodb";
import deleteData from "./data/delete.json";
import moduleConfig from "../module.json";
import utils from "../../../shared/lib/utils";

export default () => ({
    schema: {
        body: deleteData.root
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
        if (!auth.statusAdmin()) {
            response.unauthorizedError();
            return;
        }
        // Validate form
        if (req.validationError) {
            log.error(null, req.validationError.message);
            response.validationError(req.validationError);
            return;
        }
        const {
            collectionName
        } = req.zoiaModulesConfig[moduleConfig.id];
        try {
            // Build query
            const queryDb = {
                $or: req.body.ids.map(id => ({
                    _id: new ObjectId(id)
                }))
            };
            // Get requested data
            const dataDb = (await this.mongo.db.collection(collectionName).find(queryDb).toArray()) || [];
            // Check permission
            let allowed = true;
            dataDb.map(i => {
                if (allowed && !acl.checkPermission(moduleConfig.id, "delete", i.uid)) {
                    allowed = false;
                }
            });
            if (!allowed) {
                response.requestAccessDeniedError();
                return;
            }
            // Get a list of files and images to delete
            const {
                filesList,
                imagesList
            } = utils.getFilesAndImagesArr(dataDb, req.zoiaConfig.languages);
            // Remove files (both from DB and disk)
            await utils.removeFiles(filesList, req.zoiaConfig);
            // Remove images (from disk)
            await utils.removeImages(imagesList, req.zoiaConfig);
            // Delete requested IDs
            const result = await this.mongo.db.collection(collectionName).deleteMany(queryDb);
            // Check result
            if (!result || !result.result || !result.result.ok) {
                response.deleteError();
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
