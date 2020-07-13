import {
    ObjectId
} from 'mongodb';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    maxLength: 2000,
                    pattern: '([-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b)?([-a-zA-Z0-9()@:%_+.~#?&//=]*)?'
                },
                language: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 2,
                    pattern: '^[a-z]+$'
                },
                token: {
                    type: 'string'
                },
                folders: {
                    type: 'boolean'
                },
                nav: {
                    type: 'boolean'
                },
                user: {
                    type: 'boolean'
                }
            },
            required: ['url', 'language']
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
            // Find page with given URL
            const pageData = await this.mongo.db.collection('pages').findOne({
                fullPath: req.body.url
            });
            if (!pageData || !pageData.data || !pageData.data[req.body.language]) {
                return rep.sendNotFoundError(rep, 'Non-existent record or missing locale');
            }
            pageData.current = pageData.data[req.body.language];
            delete pageData.data;
            // Additional things
            const nav = req.body.nav ? await this.mongo.db.collection('registry').findOne({
                _id: 'nav_folder_tree'
            }) : null;
            const folders = req.body.folders ? await this.mongo.db.collection('registry').findOne({
                _id: 'pages_folder_tree'
            }) : null;
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
                page: pageData,
                nav,
                folders,
                user
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
