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
                folders: {
                    type: 'array'
                }
            },
            required: ['token', 'folders']
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
            // Modify tree
            loop(req.body.folders, item => delete item.title);
            // Update
            const update = await this.mongo.db.collection('registry').updateOne({
                _id: 'pages_folder_tree'
            }, {
                $set: {
                    data: req.body.folders
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                return rep.sendBadRequestError(rep, 'Cannot update database record');
            }
            // Send response
            return rep.sendSuccessJSON(rep);
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
