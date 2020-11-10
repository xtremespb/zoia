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
        const response = new this.Response(req, rep);
        const log = new this.LoggerHelpers(req, this);
        if (req.validationError) {
            log.error(null, req.validationError.message);
            response.validationError(req.validationError);
            return;
        }
        try {
            const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
            const tokenSigned = await auth.login(req.body.username.toLowerCase(), req.body.password);
            if (!tokenSigned) {
                response.unauthorizedError(C.SEND_USERNAME_PASSWORD_FIELDS_ERROR);
                return;
            }
            response.successJSON({
                token: tokenSigned
            });
        } catch (e) {
            log.error(e);
            response.internalServerError(e.message);
        }
    }
});
