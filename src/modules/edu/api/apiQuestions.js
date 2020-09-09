import cloneDeep from "lodash/cloneDeep";
import crypto from "crypto";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import eduQuestions from "./data/eduQuestions.json";
import {
    tests
} from "../shared/data";

export default () => ({
    schema: {
        body: eduQuestions.root
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
            // Check time limit
            if (testData.timeLimit) {
                const timestampStart = parseInt(sessionDb.createdAt.getTime() / 1000, 10);
                const timestampNow = parseInt(new Date().getTime() / 1000, 10);
                const timeRemain = timestampStart + testData.timeLimit - timestampNow;
                let timeWait = -1;
                if (sessionDb.recentAttempt && sessionDb.history && sessionDb.history[sessionDb.recentAttempt - 1] && !sessionDb.history[sessionDb.recentAttempt - 1].success) {
                    const completedAt = parseInt(sessionDb.history[sessionDb.recentAttempt - 1].completedAt.getTime() / 1000, 10);
                    const timestampResume = completedAt + testData.timeWait;
                    timeWait = timestampResume - timestampNow;
                }
                if (timeRemain <= 0 || timeWait >= 0) {
                    rep.requestError(rep, {
                        failed: true,
                        error: "No time left",
                        errorKeyword: "timeOver",
                        errorData: []
                    });
                    return;
                }
            }
            const answers = sessionDb.answers || {};
            const questionData = cloneDeep(tests[`${req.body.program}_${req.body.module}_${req.body.test}`].questions[questionDb.index]);
            questionData.correctCount = questionData.correct.length;
            questionData.answers = questionData.answers.map((a, i) => ({
                text: a,
                id: crypto.createHash("md5").update(`${user._id}_${req.body.id}_${i}`).digest("hex")
            })).sort(() => Math.random() - 0.5);
            questionData.id = req.body.id;
            questionData.userAnswers = answers[questionDb.id] || [];
            delete questionData.correct;
            return rep.successJSON(rep, questionData);
        } catch (e) {
            rep.logError(req, null, e);
            return Promise.reject(e);
        }
    }
});
