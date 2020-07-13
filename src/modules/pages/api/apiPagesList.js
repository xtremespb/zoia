const sortColumns = ['title', 'path'];

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
                },
                language: {
                    type: 'string',
                    pattern: `^(${Object.keys(fastify.zoiaConfig.languages).join('|')})$`
                }
            },
            required: ['token', 'page', 'sortColumn', 'sortDirection', 'language']
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
            // Get pages
            const options = {
                sort: {}
            };
            const query = {};
            if (req.body.search) {
                query.$or = [...Object.keys(req.zoiaConfig.languages).map(language => {
                    const sr = {};
                    sr[`data.${language}.title`] = {
                        $regex: req.body.search,
                        $options: 'i'
                    };
                    return sr;
                }), {
                    path: {
                        $regex: req.body.search,
                        $options: 'i'
                    }
                }, {
                    filename: {
                        $regex: req.body.search,
                        $options: 'i'
                    }
                }];
            }
            const count = await this.mongo.db.collection('pages').find(query, options).count();
            options.limit = req.zoiaConfig.commonItemsLimit;
            options.skip = (req.body.page - 1) * req.zoiaConfig.commonItemsLimit;
            options.projection = {
                _id: 1,
                path: 1,
                filename: 1
            };
            Object.keys(req.zoiaConfig.languages).map(language => options.projection[`data.${language}.title`] = 1);
            options.sort[req.body.sortColumn] = req.body.sortDirection === 'asc' ? 1 : -1;
            if (req.body.sortColumn === 'path') {
                options.sort.filename = req.body.sortDirection === 'asc' ? 1 : -1;
            }
            const pages = (await this.mongo.db.collection('pages').find(query, options).toArray() || []).map(p => {
                const page = {
                    _id: p._id,
                    path: `${p.path === '/' ? '' : p.path}${p.filename ? `/${p.filename}` : ''}` || '/'
                };
                const defaultLanguage = Object.keys(req.zoiaConfig.languages)[0];
                page.title = p.data[req.body.language] && p.data[req.body.language].title ? p.data[req.body.language].title : null || p.data[defaultLanguage] ? p.data[defaultLanguage].title : '';
                return page;
            });
            // Send response
            return rep.sendSuccessJSON(rep, {
                items: pages,
                total: count
            });
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
