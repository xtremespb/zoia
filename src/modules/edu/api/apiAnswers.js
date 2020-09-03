import crypto from "crypto";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import eduAnswers from "./data/eduAnswers.json";
import {
    tests
} from "../shared/data";

export default () => ({
    schema: {
        body: eduAnswers.root
    },
    attachValidation: true,
    async handler(req, rep) {
        // Check permissions
        const auth = new Auth(this.mongo.db, this, req, rep, C.USE_BEARER_FOR_TOKEN);
        if (!(await auth.getUserData()) || !auth.checkStatus("active")) {
            rep.unauthorizedError(rep);
            return;
        }
        const testData = tests[`${req.body.program}_${req.body.module}_${req.body.test}`];
        if (!testData) {
            rep.requestError(rep, {
                failed: true,
                error: "Could not find test data",
                errorKeyword: "testNotFound",
                errorData: []
            });
            return;
        }
        try {
            const user = auth.getUser();
            const testSession = crypto.createHash("md5").update(`${user._id}_${req.body.program}_${req.body.module}_${req.body.test}`).digest("hex");
            const sessionDb = await this.mongo.db.collection("eduSessions").findOne({
                _id: testSession
            });
            if (!sessionDb || !sessionDb.questions || !sessionDb.questions.length) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Could not find test session",
                    errorKeyword: "sessionNotFound",
                    errorData: []
                });
                return;
            }
            const questionDb = sessionDb.questions.find(q => q.id === req.body.id);
            if (!questionDb) {
                rep.requestError(rep, {
                    failed: true,
                    error: "Could not find test ID",
                    errorKeyword: "idNotFound",
                    errorData: []
                });
                return;
            }
            const answers = sessionDb.answers || {};
            answers[req.body.id] = req.body.answers;
            await this.mongo.db.collection("eduSessions").updateOne({
                _id: testSession
            }, {
                $set: {
                    answers
                },
            }, {
                upsert: false,
            });
            return rep.successJSON(rep, {});
        } catch (e) {
            rep.logError(req, null, e);
            return Promise.reject(e);
        }
    }
});
