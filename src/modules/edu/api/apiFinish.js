import crypto from "crypto";
import Auth from "../../../shared/lib/auth";
import C from "../../../shared/lib/constants";
import eduFinish from "./data/eduFinish.json";
import {
    tests
} from "../shared/data";

export default () => ({
    schema: {
        body: eduFinish.root
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
            let correctCount = 0;
            const incorrect = {};
            sessionDb.questions.map(q => {
                const allAnswers = testData.questions[q.index].answers.map((c, i) => crypto.createHash("md5").update(`${user._id}_${q.id}_${i}`).digest("hex"));
                const correctAnswers = testData.questions[q.index].correct.map(c => crypto.createHash("md5").update(`${user._id}_${q.id}_${c - 1}`).digest("hex"));
                const userAnswers = answers[q.id] ? answers[q.id].sort() : [];
                const userAnswerIds = allAnswers.map((a, i) => userAnswers.indexOf(a) >= 0 ? i + 1 : null).filter(i => i);
                // Compare arrays
                const isCorrect = correctAnswers.sort().reduce((a, b) => a && userAnswers.includes(b), true);
                if (!isCorrect) {
                    incorrect[q.index + 1] = {
                        correct: testData.questions[q.index].correct,
                        user: userAnswerIds
                    };
                }
                correctCount = isCorrect ? correctCount + 1 : correctCount;
            });
            const questionsCount = testData.questions.length;
            const correctPercentage = parseInt((100 / questionsCount) * correctCount, 10);
            const testResult = {
                success: correctPercentage >= testData.successPercentage,
                questionsCount,
                correctCount,
                correctPercentage,
                successPercentage: testData.successPercentage,
                completedAt: new Date(),
            };
            if ((testData.incorrectHistoryOnSuccess && testResult.success) || (testData.incorrectHistoryOnFail && !testResult.success)) {
                testResult.incorrect = incorrect;
            }
            const history = sessionDb.history || [];
            history.push(testResult);
            await this.mongo.db.collection("eduSessions").updateOne({
                _id: testSession
            }, {
                $set: {
                    recentAttempt: history.length,
                    history
                },
            }, {
                upsert: false,
            });
            return rep.successJSON(rep, {
                result: testResult,
                attempts: history.length
            });
        } catch (e) {
            rep.logError(req, null, e);
            return Promise.reject(e);
        }
    }
});
