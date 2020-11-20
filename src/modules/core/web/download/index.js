import fs from "fs-extra";
import path from "path";

export default () => ({
    // eslint-disable-next-line consistent-return
    async handler(req, rep) {
        if (!req.query.id || typeof req.query.id !== "string" || !req.query.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)) {
            rep.callNotFound();
            return rep.code(204);
        }
        try {
            const {
                auth,
            } = req.zoia;
            const file = await this.mongo.db.collection(req.zoiaConfig.collections.files).findOne({
                _id: req.query.id
            });
            if (!file) {
                rep.callNotFound();
                return rep.code(204);
            }
            if (file.auth || file.admin) {
                if ((file.auth && (!auth.getUser() || !auth.getUser()._id)) || (file.admin && !auth.checkStatus("admin"))) {
                    rep.callNotFound();
                    return rep.code(204);
                }
            }
            const stream = fs.createReadStream(path.resolve(`${__dirname}/../../${req.zoiaConfig.directories.files}/${file._id}`));
            rep.code(200).headers({
                "Content-Disposition": `attachment; filename="${file.name}"`,
                "Content-Type": file.mime
            }).send(stream);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
