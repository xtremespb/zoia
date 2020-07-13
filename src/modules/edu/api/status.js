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
                token: {
                    type: 'string'
                },
            },
            required: ['token', 'program']
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
            const programsMetadata = await fs.readJSON(path.resolve(`${__dirname}/../data/edu/programs.json`));
            if (!programsMetadata.avail.find(m => m.id === req.body.program)) {
                return rep.sendNotFoundError(rep, 'Program not found');
            }
            const programMetadata = await fs.readJSON(path.resolve(`${__dirname}/../data/edu/${req.body.program}.json`));
            const defaultAvail = {};
            programMetadata.modules.map((m, i) => defaultAvail[m.id] = i === 0);
            const status = await this.mongo.db.collection('edu_status').findOne({
                _id: new ObjectId(user._id)
            }) || {
                avail: defaultAvail
            };
            return rep.sendSuccessJSON(rep, {
                status
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
