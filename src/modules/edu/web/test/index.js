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
            const sessionDb = await this.mongo.db.collection("eduSessions").findOneAndUpdate({
                _id: testSession
            }, {
                $setOnInsert: defaults,
            }, {
                returnOriginal: true,
                upsert: true,
            });
            const sessionData = sessionDb.value || defaults;
            sessionData.timestampStart = parseInt(sessionData.createdAt.getTime() / 1000, 10);
            sessionData.timestampNow = parseInt(new Date().getTime() / 1000, 10);
            if (testData.timeLimit) {
                sessionData.timeRemain = sessionData.timestampStart + testData.timeLimit - sessionData.timestampNow;
                sessionData.timeLimit = testData.timeLimit;
                if (testData.timeWait && sessionData.timeRemain < 0) {
                    sessionData.timestampResume = sessionData.timestampStart + testData.timeLimit + testData.timeWait;
                    sessionData.timeWait = sessionData.timestampResume - sessionData.timestampNow;
                    delete sessionData.timeRemain;
                }
                if (sessionData.timeWait <= 0) {
                    await this.mongo.db.collection("eduSessions").updateOne({
                        _id: testSession
                    }, {
                        $set: defaults,
                    }, {
                        upsert: true,
                    });
                    sessionData.timestampStart = parseInt(defaults.createdAt.getTime() / 1000, 10);
                    sessionData.timeRemain = sessionData.timestampStart + testData.timeLimit - sessionData.timestampNow;
                    delete sessionData.timeWait;
                    delete sessionData.timestampResume;
                }
            } else {
                sessionData.noTimeLimit = true;
            }
            sessionData.questions = sessionData.questions.map(q => ({
                id: q.id,
                title: testData.questions[q.index].title
            }));
            sessionData.questionsCount = sessionData.questions.length;
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
