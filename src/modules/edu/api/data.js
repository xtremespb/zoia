import path from 'path';
import fs from 'fs-extra';

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
            required: ['token']
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
            const data = {};
            data.programs = await fs.readJSON(path.resolve(`${__dirname}/../data/edu/programs.json`));
            if (req.body.program) {
                if (!data.programs.avail.find(m => m.id === req.body.program)) {
                    return rep.sendNotFoundError(rep, 'Program not found');
                }
                const program = await fs.readJSON(path.resolve(`${__dirname}/../data/edu/${req.body.program}.json`));
                data.modules = program.modules.map(m => ({
                    id: m.id,
                    title: m.title,
                    desc: m.desc
                }));
                if (req.body.module) {
                    data.module = program.modules.find(m => m.id === req.body.module);
                    if (!data.module) {
                        return rep.sendNotFoundError(rep, 'Module not found');
                    }
                    try {
                        data.module.test.test = data.module.test.test.map((testItem, testItemIndex) => ({
                            id: testItemIndex,
                            title: testItem.title,
                            answers: testItem.answers.map((answer, answerIndex) => ({
                                id: answerIndex,
                                title: answer
                            })).sort(() => Math.random() - 0.5),
                            answersCount: testItem.correct.length
                        })).sort(() => Math.random() - 0.5);
                    } catch (e) {
                        // Ignore
                    }
                }
            }
            return rep.sendSuccessJSON(rep, {
                data
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
