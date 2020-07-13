import path from 'path';
import fs from 'fs-extra';
import {
    ObjectId
} from 'mongodb';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                program: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 64,
                    pattern: '^[a-z0-9]+$'
                },
                module: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 64,
                    pattern: '^[a-z0-9]+$'
                },
                answers: {
                    type: 'object'
                },
                token: {
                    type: 'string'
                },
            },
            required: ['program', 'module', 'answers', 'token']
        }
    },
    attachValidation: true,
    async handler(req, rep) {
        // Start of Validation
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            return rep.sendBadRequestException(rep, 'Request validation error', req.validationError);
        }
        // End of Validation
        // Check permissions
        const user = await req.verifyToken(req.body.token, fastify, this.mongo.db);
        if (!user || !user.admin) {
            rep.logError(req, 'Authentication failed');
            return rep.sendUnauthorizedException(rep, {
                default: {
                    username: '',
                    password: ''
                }
            });
        }
        // End of check permissions
        try {
            const programs = await fs.readJSON(path.resolve(`${__dirname}/../data/edu/programs.json`));
            if (!programs.avail.find(m => m.id === req.body.program)) {
                return rep.sendNotFoundError(rep, 'Program not found');
            }
            const program = await fs.readJSON(path.resolve(`${__dirname}/../data/edu/${req.body.program}.json`));
            const moduleData = program.modules.find(m => m.id === req.body.module);
            if (!module) {
                return rep.sendNotFoundError(rep, 'Module not found');
            }
            const eduStatusData = await this.mongo.db.collection('edu_status').findOne({
                _id: new ObjectId(user._id)
            });
            if (!eduStatusData || !eduStatusData.avail[req.body.module] || !eduStatusData[req.body.module]) {
                return rep.sendUnauthorizedError(rep);
            }
            const modulesAvail = Object.keys(eduStatusData.avail);
            const currentModuleIndex = modulesAvail.findIndex(i => i === req.body.module);
            const nowTimestamp = parseInt(Date.now() / 1000, 10);
            const executionData = eduStatusData[req.body.module];
            // Check if already finished
            if (executionData.finished) {
                return rep.sendBadRequestError(rep, 'Already finished', {}, 1);
            }
            // Check if time is over
            if (moduleData.test.timeLimit && (!executionData.endTime || nowTimestamp > executionData.endTime || executionData.nextAttempt)) {
                return rep.sendBadRequestError(rep, 'Time is over', {}, 2);
            }
            // Verify answers
            let correctAnswers = 0;
            const correct = {};
            const wrong = {};
            moduleData.test.test.map((q, qIdx) => {
                const a = req.body.answers[qIdx];
                if (!a) {
                    return;
                }
                if (Array.isArray(a)) {
                    const as = a.map(i => parseInt(i, 10) + 1).sort();
                    const ac = q.correct.sort();
                    if (as.length === ac.length && as.every((value, index) => value === ac[index])) {
                        correctAnswers += 1;
                    } else {
                        correct[qIdx] = ac;
                        wrong[qIdx] = as;
                    }
                } else if (parseInt(a, 10) === q.correct[0] - 1) {
                    correctAnswers += 1;
                } else {
                    // eslint-disable-next-line prefer-destructuring
                    correct[qIdx] = q.correct;
                    wrong[qIdx] = [parseInt(a, 10) + 1];
                }
            });
            // Check results
            const questionsTotal = moduleData.test.test.length;
            const correctAnswersPercentage = parseInt((100 / questionsTotal) * correctAnswers, 10);
            if (moduleData.test.minPercentage && correctAnswersPercentage < moduleData.test.minPercentage) {
                if (moduleData.test.timeLimit) {
                    eduStatusData[req.body.module].endTime = null;
                    eduStatusData[req.body.module].nextAttempt = nowTimestamp + moduleData.test.nextAttempt;
                    eduStatusData[req.body.module].testAttempts = eduStatusData[req.body.module].testAttempts ? eduStatusData[req.body.module].testAttempts + 1 : 1;
                    const update = await this.mongo.db.collection('edu_status').updateOne({
                        _id: new ObjectId(user._id)
                    }, {
                        $set: eduStatusData
                    }, {
                        upsert: true
                    });
                    // Check result
                    if (!update || !update.result || !update.result.ok) {
                        return rep.sendBadRequestError(rep, 'Cannot update database record');
                    }
                }
                return rep.sendBadRequestError(rep, 'Test is not passed', {
                    current: correctAnswersPercentage,
                    required: moduleData.test.minPercentage,
                    nextAttemptRemaining: moduleData.test.nextAttempt
                }, 3);
            }
            // Write results to DB
            const nextModule = modulesAvail.length >= currentModuleIndex + 1 ? modulesAvail[currentModuleIndex + 1] : null;
            if (nextModule) {
                eduStatusData.avail[nextModule] = true;
            }
            eduStatusData[req.body.module].finished = true;
            eduStatusData[req.body.module].testAttempts = eduStatusData[req.body.module].testAttempts ? eduStatusData[req.body.module].testAttempts + 1 : 1;
            eduStatusData[req.body.module].finishedAt = new Date();
            eduStatusData[req.body.module].percentage = correctAnswersPercentage;
            eduStatusData[req.body.module].endTime = null;
            eduStatusData[req.body.module].correct = correct;
            eduStatusData[req.body.module].wrong = wrong;
            const update = await this.mongo.db.collection('edu_status').updateOne({
                _id: new ObjectId(user._id)
            }, {
                $set: eduStatusData
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                return rep.sendBadRequestError(rep, 'Cannot update database record');
            }
            // Send response
            return rep.sendSuccessJSON(rep, {
                status: eduStatusData
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
