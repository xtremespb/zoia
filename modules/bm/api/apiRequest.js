import Moment from "moment";
import {
    extendMoment
} from "moment-range";
import {
    ObjectId
} from "mongodb";
import priceData from "./data/request.json";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";

const moment = extendMoment(Moment);

export default fastify => ({
    schema: {
        body: priceData.schema
    },
    attachValidation: true,
    async handler(req, rep) {
        // Validate form
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            rep.validationError(rep, req.validationError);
            return;
        }
        const auth = new Auth(this.mongo.db, fastify, req, rep, C.USE_COOKIE_FOR_TOKEN);
        if (!(await auth.validateCaptcha(req.body.captchaSecret, req.body.captcha))) {
            rep.requestError(rep, {
                failed: true,
                error: "Security error",
                errorData: [{
                    keyword: "invalidCaptcha",
                    dataPath: ".captcha",
                    clear: true,
                    reloadCaptcha: true
                }]
            });
            return;
        }
        try {
            const yacht = req.body.id ? (await this.mongo.db.collection("yachts").findOne({
                _id: new ObjectId(req.body.id)
            })) : null;
            if (!yacht) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Database error",
                    errorKeyword: "yachtNotFound",
                    errorData: []
                });
                return;
            }
            const dateFrom = moment.utc(String(req.body.dateFrom), "DDMMYYYY").startOf("day");
            const dateTo = moment.utc(String(req.body.dateTo), "DDMMYYYY").endOf("day");
            if (dateFrom.isValid() && dateTo.isValid()) {
                // Cool!
            }
            rep.successJSON(rep, {});
            return;
        } catch (e) {
            rep.logError(req, null, e);
            rep.internalServerError(rep, e.message);
        }
    }
});
