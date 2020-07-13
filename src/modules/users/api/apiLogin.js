import crypto from 'crypto';
import { v4 as uuid } from 'uuid';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    minLength: 4,
                    maxLength: 32,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 64
                }
            },
            required: ['username', 'password']
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
        // Processing
        try {
            const passwordHash = crypto.createHmac('sha512', fastify.zoiaConfigSecure.secret).update(req.body.password).digest('hex');
            const user = await this.mongo.db.collection('users').findOne({
                username: req.body.username
            });
            if (!user || user.password !== passwordHash) {
                rep.logError(req, 'Authentication failed');
                return rep.sendUnauthorizedException(rep, {
                    default: {
                        username: '',
                        password: ''
                    }
                });
            }
            // Prepare token
            const sessionId = user.sessionId || uuid();
            const userId = String(user._id);
            const token = fastify.jwt.sign({
                userId,
                sessionId
            }, {
                expiresIn: fastify.zoiaConfigSecure.authTokenExpiresIn
            });
            // Update database and set session ID
            await this.mongo.db.collection('users').updateOne({
                _id: user._id
            }, {
                $set: {
                    sessionId
                }
            });
            // Send response
            return rep.sendSuccessJSON(rep, {
                token,
                username: req.body.username,
                user: {
                    username: user.username,
                    id: String(user._id)
                }
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e ? e.message : 'Internal Server Error');
        }
    }
});
