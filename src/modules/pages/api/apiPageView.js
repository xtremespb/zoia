export default () => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                },
                path: {
                    type: 'string'
                },
                language: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 2
                }
            },
            required: ['path', 'language']
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
            const path = req.body.path.toLowerCase().replace(/\/$/, '') || null;
            let parts = '';
            let filename = '';
            if (path) {
                parts = path.split(/\//).filter(i => i.length);
                if (parts.length) {
                    filename = parts.pop();
                }
            }
            const query = {
                $or: [{
                    path: `/${(parts || []).join('/')}`,
                    filename
                }, {
                    path,
                    filename: ''
                }]
            };
            const options = {
                projection: {
                    _id: 1,
                    path: 1,
                    filename: 1
                }
            };
            options.projection[`data.${req.body.language}`] = 1;
            const page = await this.mongo.db.collection('pages').findOne(query, options);
            if (!page) {
                return rep.sendNotFoundError(rep, 'Page not found');
            }
            return rep.sendSuccessJSON(rep, {
                page
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
