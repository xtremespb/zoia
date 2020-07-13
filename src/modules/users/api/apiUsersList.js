const sortColumns = ['username', 'email', 'active'];
const searchColumns = ['username', 'email'];

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                token: {
                    type: 'string'
                },
                page: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 999999999
                },
                search: {
                    type: 'string',
                    maxLength: 64
                },
                sortColumn: {
                    type: 'string',
                    pattern: `^(${sortColumns.join('|')})$`
                },
                sortDirection: {
                    type: 'string',
                    pattern: '^(asc|desc)$'
                }
            },
            required: ['token', 'page', 'sortColumn', 'sortDirection']
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
            // Get users
            const options = {
                sort: {}
            };
            const query = {};
            if (req.body.search) {
                query.$or = searchColumns.map(c => {
                    const sr = {};
                    sr[c] = {
                        $regex: req.body.search,
                        $options: 'i'
                    };
                    return sr;
                });
            }
            const count = await this.mongo.db.collection('users').find(query, options).count();
            options.limit = req.zoiaConfig.commonItemsLimit;
            options.skip = (req.body.page - 1) * req.zoiaConfig.commonItemsLimit;
            options.projection = {
                _id: 1,
                username: 1,
                email: 1,
                active: 1
            };
            options.sort[req.body.sortColumn] = req.body.sortDirection === 'asc' ? 1 : -1;
            const users = await this.mongo.db.collection('users').find(query, options).toArray();
            // Send response
            return rep.sendSuccessJSON(rep, {
                items: users,
                total: count
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
