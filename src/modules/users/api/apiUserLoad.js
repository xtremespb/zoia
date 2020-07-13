import {
    ObjectId
} from 'mongodb';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                },
                id: {
                    type: 'string',
                    minLength: 24,
                    maxLength: 24,
                    pattern: '^[a-f0-9]+$'
                }
            },
            required: ['token', 'id']
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
            // Find user with given ID
            const userRecord = await this.mongo.db.collection('users').findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!userRecord) {
                return rep.sendBadRequestError(rep, 'Non-existent record');
            }
            delete userRecord.password;
            // Send response
            return rep.sendSuccessJSON(rep, {
                data: {
                    default: {
                        username: userRecord.username,
                        email: userRecord.email,
                        active: userRecord.active ? '1' : '0',
                        admin: userRecord.admin ? '1' : '0'
                    }
                }
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
