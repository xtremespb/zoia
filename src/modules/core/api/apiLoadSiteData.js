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
                nav: {
                    type: 'boolean'
                },
                user: {
                    type: 'boolean'
                }
            },
            required: []
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
        try {
            let nav;
            if (req.body.nav) {
                nav = req.body.nav ? await this.mongo.db.collection('registry').findOne({
                    _id: 'nav_folder_tree'
                }) : null;
            }
            let user;
            if (req.body.token && req.body.user) {
                try {
                    const decodedToken = fastify.jwt.decode(req.body.token);
                    if (!decodedToken || !decodedToken.userId || !decodedToken.sessionId || Math.floor(Date.now() / 1000) > decodedToken.exp) {
                        return {};
                    }
                    user = await this.mongo.db.collection('users').findOne({
                        _id: new ObjectId(decodedToken.userId)
                    });
                    delete user.password;
                    delete user.sessionId;
                } catch (e) {
                    // Ignore
                }
            }
            // Send response
            return rep.sendSuccessJSON(rep, {
                nav,
                user
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
