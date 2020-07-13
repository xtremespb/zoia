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
            // Find page with given ID
            const pageRecord = await this.mongo.db.collection('pages').findOne({
                _id: new ObjectId(req.body.id)
            });
            if (!pageRecord) {
                return rep.sendNotFoundError(rep, 'Non-existent record or missing locale');
            }
            Object.keys(pageRecord.data).map(language => pageRecord[language] = pageRecord.data[language]);
            delete pageRecord.data;
            // Send response
            return rep.sendSuccessJSON(rep, {
                data: pageRecord
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
