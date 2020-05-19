import crypto from "crypto";
import userLogin from "./data/userLogin.json";
import Auth from "../../../shared/lib/auth";

export default fastify => ({
    schema: {
        body: userLogin.root
    },
    attachValidation: true,
    async handler(req, rep) {
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        const auth = new Auth(this.mongo.db, fastify, req);
        try {
            const user = await this.mongo.db.collection("users").findOne({
                username: req.body.username.toLowerCase()
            });
            const passwordHash = crypto.createHmac("sha256", req.zoiaConfig.secret).update(req.body.password).digest("hex");
            if (!user || user.password !== passwordHash || user.status.indexOf("active") === -1) {
                rep.unauthorizedError(rep, true);
                return;
            }
            const sid = user.sid || auth.generateSid();
            const tokenSigned = auth.signToken(user._id, sid);
            // Update database and set Session ID (sid)
            await this.mongo.db.collection("users").updateOne({
                _id: user._id
            }, {
                $set: {
                    sid
                }
            });
            rep.successJSON(rep, {
                token: tokenSigned
            });
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
