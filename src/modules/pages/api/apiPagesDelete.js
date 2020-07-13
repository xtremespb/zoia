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
                const pages = await this.mongo.db.collection('pages').find({
                    $or: query
                }).toArray();
                let thereIsRootPage;
                pages.map(p => thereIsRootPage = thereIsRootPage || p.fullPath === '/');
                if (thereIsRootPage) {
                    return rep.sendSuccessJSON(rep);
                }
            }
            const result = await this.mongo.db.collection('pages').deleteMany({
                $or: query
            });
            if (!result || !result.result || !result.result.ok) {
                return rep.sendBadRequestError(rep, 'Cannot delete database record(s)', null, 1);
            }
            // Send response
            return rep.sendSuccessJSON(rep);
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
