import {
    ObjectId
} from "mongodb";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default fastify => ({
    // eslint-disable-next-line consistent-return
    async handler(req, rep) {
        if (!req.query.id || typeof req.query.id !== "string" || !req.query.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
            rep.callNotFound();
            return rep.code(204);
        }
        try {
            const file = await this.mongo.db.collection(req.zoiaConfig.collectionFiles).findOne({
                _id: req.query.id
            });
            if (!file) {
                rep.callNotFound();
                return rep.code(204);
            }
            if (file.auth || file.admin) {
                const auth = new Auth(this.mongo.db, fastify, req, rep, C.USE_EVERYTHING_FOR_TOKEN);
                if ((file.auth && !(await auth.getUserData())) || (file.admin && !auth.checkStatus("admin"))) {
                    rep.callNotFound();
                    return rep.code(204);
                }
            }
            rep.successJSON(rep, {});
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
