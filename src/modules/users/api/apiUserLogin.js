import userLogin from "./data/userLogin.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

export default () => ({
    rateLimit: {
        max: 10,
        ban: 50,
        timeWindow: 10000
    },
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
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        try {
            const tokenSigned = await auth.login(req.body.username.toLowerCase(), req.body.password);
            if (!tokenSigned) {
                rep.unauthorizedError(rep, C.SEND_USERNAME_PASSWORD_FIELDS_ERROR);
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
