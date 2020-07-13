/* eslint no-param-reassign:0 */

const loop = (data, callback) => {
    data.forEach((item, index, arr) => {
        callback(item, index, arr);
        if (item.children) {
            loop(item.children, callback);
        }
    });
};

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                },
                language: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 2
                }
            },
            required: ['token', 'language']
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
            // Get tree
            const folderTree = await this.mongo.db.collection('registry').findOne({
                _id: 'pages_folder_tree'
            });
            const folders = (folderTree ? folderTree.data || [] : []);
            loop(folders, item => {
                const defaultTitle = item.data[Object.keys(item.data)[0]].title;
                const title = item.data[req.body.language] ? item.data[req.body.language].title || defaultTitle : defaultTitle;
                item.title = title;
            });
            // Send response
            return rep.sendSuccessJSON(rep, {
                data: folders
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
