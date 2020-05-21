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
        const auth = new Auth(this.mongo.db, fastify, req, rep);
        try {
            const tokenSigned = await auth.login(req.body.username.toLowerCase(), req.body.password);
            if (!tokenSigned) {
                rep.unauthorizedError(rep, true);
                return;
            }
            rep.successJSON(rep, {
                token: tokenSigned
            });
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
