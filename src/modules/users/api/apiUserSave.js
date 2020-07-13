import Ajv from 'ajv';
import {
    ObjectId
} from 'mongodb';
import crypto from 'crypto';

const ajv = new Ajv();

const baseValidate = ajv.compile({
    type: 'object',
    properties: {
        token: {
            type: 'string'
        },
        id: {
            type: 'string'
        }
    },
    required: ['token']
});

const formValidate = ajv.compile({
    type: 'object',
    properties: {
        username: {
            type: 'string',
            minLength: 4,
            maxLength: 32,
            pattern: '^[a-zA-Z0-9_-]+$'
        },
        password: {
            type: 'string'
        },
        email: {
            type: 'string',
            minLength: 6,
            maxLength: 129,
            pattern: '^(?:[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?(?:\\.(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?)*$'
        },
        active: {
            type: 'string',
            pattern: '^(0|1)$'
        },
        admin: {
            type: 'string',
            pattern: '^(0|1)$'
        }
    },
    required: ['username', 'email', 'active', 'admin']
});

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
            const baseDataValidation = baseValidate(formData);
            const formDataValidation = formValidate(formData.default);
            if (!baseDataValidation || !formDataValidation || (formData.id && (formData.id.length !== 24 || !formData.id.match(/^[a-f0-9]+$/)))) {
                const errorData = {
                    base: baseDataValidation ? undefined : (baseValidate.errors || {
                        error: 'General validation error'
                    }),
                    form: formDataValidation ? null : (formValidate.errors || {
                        error: 'General validation error'
                    })
                };
                rep.logError(req, errorData);
                return rep.sendBadRequestException(rep, 'Request validation error', errorData);
            }
            formData.default.active = parseInt(formData.default.active, 10);
            formData.default.admin = parseInt(formData.default.admin, 10);
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
            // Password-related checks
            const passwordUpdate = {};
            if (!formData.id && !formData.default.password) {
                return rep.sendBadRequestError(rep, 'Missing password', {
                    default: {
                        password: ''
                    }
                });
            }
            if (formData.default.password) {
                if (formData.default.password.length < 8) {
                    return rep.sendBadRequestError(rep, 'Password is too short', {
                        default: {
                            password: ''
                        }
                    });
                }
                passwordUpdate.password = crypto.createHmac('sha512', fastify.zoiaConfigSecure.secret).update(formData.default.password).digest('hex');
            }
            // Check if such user exists
            if (formData.id) {
                const userDB = await this.mongo.db.collection('users').findOne({
                    _id: new ObjectId(formData.id)
                });
                if (!userDB) {
                    return rep.sendBadRequestError(rep, 'User not found', {
                        default: {
                            username: ''
                        }
                    });
                }
                if (fastify.zoiaConfig.demo && userDB.username.match(/admin/i)) {
                    return rep.sendSuccessJSON(rep);
                }
            }
            // Check if user with such username already exists
            const dupeUsernameQuery = {
                username: formData.default.username
            };
            if (formData.id) {
                dupeUsernameQuery._id = {
                    $ne: new ObjectId(formData.id)
                };
            }
            const dupeUsername = await this.mongo.db.collection('users').findOne(dupeUsernameQuery);
            if (dupeUsername) {
                return rep.sendBadRequestError(rep, 'Duplicate username', {
                    default: {
                        username: ''
                    }
                });
            }
            // Check if user with such e-mail address already exists
            const dupeEmailQuery = {
                email: formData.default.email
            };
            if (formData.id) {
                dupeEmailQuery._id = {
                    $ne: new ObjectId(formData.id)
                };
            }
            const dupeEmail = await this.mongo.db.collection('users').findOne(dupeEmailQuery);
            if (dupeEmail) {
                return rep.sendBadRequestError(rep, 'Duplicate e-mail', {
                    default: {
                        email: ''
                    }
                });
            }
            // Update database
            const update = await this.mongo.db.collection('users').updateOne(formData.id ? {
                _id: new ObjectId(formData.id)
            } : {
                username: formData.default.username
            }, {
                $set: {
                    username: formData.default.username,
                    email: formData.default.email,
                    active: formData.default.active === 1,
                    admin: formData.default.admin === 1,
                    ...passwordUpdate
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
