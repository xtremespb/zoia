import Ajv from 'ajv';

const ajv = new Ajv();

const formValidate = ajv.compile({
    type: 'object',
    properties: {
        token: {
            type: 'string'
        },
        language: {
            type: 'string'
        },
        default: {
            type: 'object'
        }
    },
    required: ['token', 'language', 'default']
});

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
                __form_data: {
                    type: 'string'
                }
            },
            required: ['__form_data']
        }
    },
    attachValidation: true,
    async handler(req, rep) {
        // Start of Pre-Validation
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            return rep.sendBadRequestException(rep, 'Request validation error', req.validationError);
        }
        // End of Pre-Validation
        try {
            const formData = JSON.parse(req.body.__form_data);
            // Start of Form Validation
            const formDataValidation = formValidate(formData);
            if (!formDataValidation || !formData.default || !formData.default.nav || !formData.default.nav.tree) {
                const errorData = {
                    form: formDataValidation ? null : (formValidate.errors || {
                        error: 'General validation error'
                    })
                };
                rep.logError(req, errorData);
                return rep.sendBadRequestException(rep, 'Request validation error', errorData);
            }
            // End of Form Validation
            // Check permissions
            const user = await req.verifyToken(formData.token, fastify, this.mongo.db);
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
            // Update
            const {
                tree
            } = formData.default.nav;
            // eslint-disable-next-line no-param-reassign
            loop(tree, item => delete item.title);
            if (fastify.zoiaConfig.demo) {
                return rep.sendSuccessJSON(rep);
            }
            const update = await this.mongo.db.collection('registry').updateOne({
                _id: 'nav_folder_tree'
            }, {
                $set: {
                    data: formData.default.nav.tree
                }
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                return rep.sendBadRequestError(rep, 'Cannot update database record');
            }
            return rep.sendSuccessJSON(rep);
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
