import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    attachValidation: false,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
            rep.unauthorizedError(rep);
            return;
        }
        // Get ID from body
        try {
            const data = (await this.mongo.db.collection(req.zoiaConfig.collections.registry).findOne({
                _id: "cm_data"
            })) || {};
            data.config = data.config ? JSON.stringify(data.config, null, "\t") : "";
            data.attachments = [];
            // Return "success" result
            rep.successJSON(rep, {
                data
            });
            return;
        } catch (e) {
            // There is an exception, send error 500 as response
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
