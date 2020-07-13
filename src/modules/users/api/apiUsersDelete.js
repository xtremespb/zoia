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
                ids: {
                    type: 'array',
                    minItems: 1,
                    contains: {
                        type: 'string',
                        minLength: 24,
                        maxLength: 24,
                        pattern: '^[a-f0-9]+$'
                    }
                }
            },
            required: ['token', 'ids']
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
            const query = req.body.ids.map(id => ({
                _id: new ObjectId(id)
            }));
            if (fastify.zoiaConfig.demo) {
                const users = await this.mongo.db.collection('users').find({
                    $or: query
                }).toArray();
                let thereIsAdmin;
                users.map(u => thereIsAdmin = thereIsAdmin || u.username.match(/admin/i));
                if (thereIsAdmin) {
                    return rep.sendSuccessJSON(rep);
                }
            }
            const result = await this.mongo.db.collection('users').deleteMany({
                $or: query
            });
            if (!result || !result.result || !result.result.ok) {
                return rep.sendBadRequestError(rep, 'Cannot delete database record(s)');
            }
            // Send response
            return rep.sendSuccessJSON(rep);
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
