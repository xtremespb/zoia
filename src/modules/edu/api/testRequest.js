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
                token: {
                    type: 'string'
                },
            },
            required: ['module', 'token']
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
            const defaultAvail = {};
            program.modules.map((m, i) => defaultAvail[m.id] = i === 0);
            const status = await this.mongo.db.collection('edu_status').findOne({
                _id: new ObjectId(user._id)
            }) || {
                avail: defaultAvail
            };
            if (!status.avail[req.body.module]) {
                return rep.sendUnauthorizedError(rep);
            }
            if (!status[req.body.module]) {
                status[req.body.module] = {
                    finished: false,
                    testAttempts: 0,
                };
            }
            if (status[req.body.module].finished) {
                return rep.sendSuccessJSON(rep, {
                    slot: status[req.body.module]
                });
            }
            const nowTimestamp = parseInt(Date.now() / 1000, 10);
            status[req.body.module].startedAt = nowTimestamp;
            if (moduleData.test.timeLimit) {
                const endTimeCurrent = nowTimestamp + moduleData.test.timeLimit;
                const nextAttemptCurrent = endTimeCurrent + moduleData.test.nextAttempt;
                if (!status[req.body.module].endTime) {
                    status[req.body.module].endTime = endTimeCurrent;
                }
                if (!status[req.body.module].nextAttempt && status[req.body.module].endTime && nowTimestamp > status[req.body.module].endTime) {
                    status[req.body.module].nextAttempt = nextAttemptCurrent;
                }
                if (status[req.body.module].nextAttempt && nowTimestamp > status[req.body.module].nextAttempt) {
                    status[req.body.module].nextAttempt = null;
                    status[req.body.module].endTime = endTimeCurrent;
                    status[req.body.module].testAttempts = status[req.body.module].testAttempts ? status[req.body.module].testAttempts + 1 : 1;
                }
            } else {
                status[req.body.module].unlimited = true;
            }
            const update = await this.mongo.db.collection('edu_status').updateOne({
                _id: new ObjectId(user._id)
            }, {
                $set: {
                    _id: new ObjectId(user._id),
                    ...status
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                return rep.sendBadRequestError(rep, 'Cannot update database record');
            }
            if (status[req.body.module].nextAttempt && status[req.body.module].nextAttempt > nowTimestamp) {
                status[req.body.module].nextAttemptRemaining = status[req.body.module].nextAttempt - nowTimestamp;
            }
            return rep.sendSuccessJSON(rep, {
                slot: status[req.body.module]
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
