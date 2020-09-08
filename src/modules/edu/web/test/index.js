import crypto from "crypto";
import {
    v4 as uuid
} from "uuid";
import template from "./index.marko";
import Auth from "../../../../shared/lib/auth";

export default (programs, tests) => ({
    async handler(req, rep) {
        if (!req.params || !req.params.programId || !programs[req.params.programId] || !req.params.moduleId) {
            rep.callNotFound();
            return rep.code(204);
        }
        const moduleData = programs[req.params.programId].modules.find(m => m.id === req.params.moduleId);
        if (!moduleData || !tests[`${req.params.programId}_${req.params.moduleId}_${req.params.testId}`]) {
            rep.callNotFound();
            return rep.code(204);
        }
        const auth = new Auth(this.mongo.db, this, req, rep);
        const site = new req.ZoiaSite(req, "edu");
        if (!(await auth.getUserData()) || !auth.checkStatus("active")) {
            auth.clearAuthCookie();
            return rep.redirectToLogin(req, rep, site, req.zoiaModulesConfig["edu"].routes.index);
        }
        const testData = tests[`${req.params.programId}_${req.params.moduleId}_${req.params.testId}`];
        const user = auth.getUser();
        const testSession = crypto.createHash("md5").update(`${user._id}_${req.params.programId}_${req.params.moduleId}_${req.params.testId}`).digest("hex");
        const defaults = {
            createdAt: new Date()
        };
        defaults.questions = testData.questions.map((q, i) => ({
            index: i,
            id: uuid()
        })).sort(() => Math.random() - 0.5);
        try {
            // Get current session
            const sessionDb = await this.mongo.db.collection("eduSessions").findOneAndUpdate({
                _id: testSession
            }, {
                $setOnInsert: defaults,
            }, {
                returnOriginal: true,
                upsert: true,
            });
            // If there is no session, use default values
            let sessionData = sessionDb.value || defaults;
            // Calculate "test started at" UNIX timestamp based on session creation time
            sessionData.timestampStart = parseInt(sessionData.createdAt.getTime() / 1000, 10);
            // Get current UNIX timestamp
            sessionData.timestampNow = parseInt(new Date().getTime() / 1000, 10);
            // Set "result" value from the latest history item
            sessionData.result = sessionData.recentAttempt && sessionData.history && sessionData.history[sessionData.recentAttempt - 1] ? sessionData.history[sessionData.recentAttempt - 1] : null;
            // If current test has a time limit set
            if (testData.timeLimit) {
                // Calculate remaining time (seconds)
                sessionData.timeRemain = sessionData.timestampStart + testData.timeLimit - sessionData.timestampNow;
                // Put test time limit (seconds) into result
                sessionData.timeLimit = testData.timeLimit;
                // If there is a waiting time between attempts
                if (testData.timeWait) {
                    // If there was a recent "failed" attempt
                    if (sessionData.recentAttempt && sessionData.history && sessionData.history[sessionData.recentAttempt - 1] && !sessionData.history[sessionData.recentAttempt - 1].success) {
                        // Get the "test completed at" UNIX timestamp
                        const completedAt = parseInt(sessionData.history[sessionData.recentAttempt - 1].completedAt.getTime() / 1000, 10);
                        // Calculate the UNIX timestamp when the next test attempt can be started at
                        sessionData.timestampResume = completedAt + testData.timeWait;
                        // Calculate the remaining waiting time (seconds)
                        sessionData.timeWait = sessionData.timestampResume - sessionData.timestampNow;
                        // We don't need remaining time because we do already have the waiting time set
                        delete sessionData.timeRemain;
                    } else if (sessionData.timeRemain && sessionData.timeRemain < 0) {
                        // If there is no remaining time left
                        // Calculate the UNIX timestamp when the next test attempt can be started at
                        sessionData.timestampResume = sessionData.timestampStart + testData.timeLimit + testData.timeWait;
                        // Calculate the remaining waiting time (seconds)
                        sessionData.timeWait = sessionData.timestampResume - sessionData.timestampNow;
                        // We don't need remaining time because we do already have the waiting time set
                        delete sessionData.timeRemain;
                    }
                }
                // If the waiting time is over
                if (sessionData.timeWait <= 0) {
                    // Reset answers & result in the current session
                    // Set new randomized questions etc.
                    await this.mongo.db.collection("eduSessions").updateOne({
                        _id: testSession
                    }, {
                        $set: {
                            ...defaults,
                            answers: {},
                            recentAttempt: null
                        },
                    }, {
                        upsert: true,
                    });
                    sessionData = {
                        ...sessionData,
                        ...defaults,
                        result: null
                    };
                    // Set new "test started at" UNIX timestamp
                    sessionData.timestampStart = parseInt(defaults.createdAt.getTime() / 1000, 10);
                    // Calculate "remaining time" (in seconds)
                    sessionData.timeRemain = sessionData.timestampStart + testData.timeLimit - sessionData.timestampNow;
                    // Delete obsolete values
                    delete sessionData.timeWait;
                    delete sessionData.timestampResume;
                }
            } else {
                // There are no time limits
                sessionData.noTimeLimit = true;
                // If there was a result already, reset
                if (sessionData.recentAttempt) {
                    await this.mongo.db.collection("eduSessions").updateOne({
                        _id: testSession
                    }, {
                        $set: {
                            ...defaults,
                            answers: {},
                            recentAttempt: null
                        },
                    }, {
                        upsert: true,
                    });
                    sessionData = {
                        ...sessionData,
                        ...defaults,
                        result: null
                    };
                }
            }
            // Get Questions
            sessionData.questions = sessionData.questions.map(q => ({
                id: q.id,
                title: testData.questions[q.index].title
            }));
            sessionData.questionsCount = sessionData.questions.length;
            // Render the template
            const render = await template.stream({
                $global: {
                    serializedGlobals: {
                        template: true,
                        pageTitle: true,
                        program: true,
                        routes: true,
                        programId: true,
                        testId: true,
                        moduleData: true,
                        moduleId: true,
                        sessionData: true,
                        ...site.getSerializedGlobals()
                    },
                    template: req.zoiaTemplates.available[0],
                    pageTitle: site.i18n.t("programs"),
                    programId: req.params.programId,
                    program: programs[req.params.programId],
                    moduleData,
                    moduleId: req.params.moduleId,
                    testId: req.params.testId,
                    routes: {
                        ...req.zoiaModulesConfig["edu"].routes,
                    },
                    sessionData,
                    ...site.getGlobals(),
                }
            });
            return rep.sendHTML(rep, render);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
