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
            const answers = sessionDb.answers || {};
            let correctCount = 0;
            sessionDb.questions.map(q => {
                const correctAnswers = testData.questions[q.index].correct.map(c => crypto.createHash("md5").update(`${user._id}_${q.id}_${c - 1}`).digest("hex")).sort();
                const userAnswers = answers[q.id] ? answers[q.id].sort() : [];
                // Compare arrays
                const isCorrect = correctAnswers.reduce((a, b) => a && userAnswers.includes(b), true);
                correctCount = isCorrect ? correctCount + 1 : correctCount;
            });
            const questionsCount = testData.questions.length;
            const correctPercentage = parseInt((100 / questionsCount) * correctCount, 10);
            const result = {
                success: correctPercentage >= testData.successPercentage,
                questionsCount,
                correctCount,
                correctPercentage,
                successPercentage: testData.successPercentage,
                completedAt: new Date()
            };
            const attempts = sessionDb.attempts ? sessionDb.attempts + 1 : 1;
            await this.mongo.db.collection("eduSessions").updateOne({
                _id: testSession
            }, {
                $set: {
                    result,
                    attempts
                },
            }, {
                upsert: false,
            });
            return rep.successJSON(rep, {
                result,
                attempts
            });
        } catch (e) {
            rep.logError(req, null, e);
            return Promise.reject(e);
        }
    }
});
