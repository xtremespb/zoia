import fs from "fs-extra";
import path from "path";
import {
    ObjectId
} from "mongodb";
import Auth from "../../../../shared/lib/auth";
import C from "../../../../shared/lib/constants";

export default () => ({
    async handler(req, rep) {
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_COOKIE_FOR_TOKEN);
        if (!req.query.id || typeof req.query.id !== "string" || !req.query.id.match(/^[a-f0-9]{24}$/)) {
            rep.callNotFound();
            return rep.code(204);
        }
        try {
            const site = new req.ZoiaSite(req, "backup");
            if (!(await auth.getUserData()) || !auth.checkStatus("admin")) {
                auth.clearAuthCookie();
                return rep.redirectToLogin(req, rep, site, req.zoiaModulesConfig["backup"].routes.admin);
            }
            const file = await this.mongo.db.collection(req.zoiaModulesConfig["backup"].collectionBackup).findOne({
                _id: new ObjectId(req.query.id)
            });
            if (!file) {
                rep.callNotFound();
                return rep.code(204);
            }
            const stream = fs.createReadStream(path.resolve(`${__dirname}/../../${req.zoiaModulesConfig["backup"].directory}/${file.filename}.bak`));
            rep.code(200).headers({
                "Content-Disposition": `attachment; filename="${file.filename}.bak"`,
                "Content-Type": "application/zip"
            }).send(stream);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
