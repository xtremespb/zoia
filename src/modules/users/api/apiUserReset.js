import {
    ObjectId
} from 'mongodb';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import mailReset from '../email/reset/index.marko';
import I18N from '../../../shared/marko/utils/i18n-node';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 64
                },
                email: {
                    type: 'string',
                    minLength: 5,
                    maxLength: 254,
                    pattern: '^(?:[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-])+@(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?(?:\\.(?:[a-zA-Z0-9]|[^\\u0000-\\u007F])(?:(?:[a-zA-Z0-9-]|[^\\u0000-\\u007F]){0,61}(?:[a-zA-Z0-9]|[^\\u0000-\\u007F]))?)*$'
                },
                captcha: {
                    type: 'string',
                    minLength: 4,
                    maxLength: 4,
                    pattern: '^[0-9]+$'
                },
                captchaSecret: {
                    type: 'string',
                    maxLength: 2048
                },
                language: {
                    type: 'string',
                    maxLength: 2,
                    minLength: 2,
                    pattern: '^[a-z]+$'
                }
            },
            required: ['password', 'email', 'captcha', 'captchaSecret']
        }
    },
    attachValidation: true,
    async handler(req, rep) {
        // Start of Validation
        if (!Object.keys(fastify.zoiaConfig.languages).find(i => i === req.body.language)) {
            req.validationError = {
                message: 'Invalid language'
            };
        }
        if (req.validationError) {
            rep.logError(req, req.validationError.message);
            return rep.sendBadRequestException(rep, 'Request validation error', req.validationError);
        }
        // End of Validation
        // Processing
        try {
            // Load locale
            const i18n = I18N('users')[req.body.language];
            // Check captcha
            if (!await req.validateCaptcha(req.body.captchaSecret, req.body.captcha, fastify, this.mongo.db)) {
                return rep.sendBadRequestError(rep, 'Invalid Captcha', {
                    default: {
                        captcha: ''
                    }
                }, 1);
            }
            // Find user by e-mail
            const email = req.body.email.toLowerCase();
            const userDB = await this.mongo.db.collection('users').findOne({
                email
            });
            if (!userDB) {
                return rep.sendBadRequestError(rep, 'Unknown user', {
                    default: {
                        email: ''
                    }
                }, 3);
            }
            // Save to the database
            const resetCode = uuid();
            const passwordReset = crypto.createHmac('sha512', fastify.zoiaConfigSecure.secret).update(req.body.password).digest('hex');
            const update = await this.mongo.db.collection('users').updateOne({
                _id: new ObjectId(userDB._id)
            }, {
                $set: {
                    passwordReset,
                    resetCode
                }
            }, {
                upsert: false
            });
            if (!update || !update.result || !update.result.ok) {
                return rep.sendBadRequestError(rep, 'Could not update a database record');
            }
            // Send e-mail message
            const prefix = req.getPrefixForLanguage(req.body.language, fastify);
            const resetURL = `${fastify.zoiaConfig.siteURL}${prefix}/users/resetConfirm?id=${userDB._id}&code=${resetCode}`;
            const subj = 'Reset password';
            const render = (await mailReset.render({
                $global: {
                    siteURL: `${fastify.zoiaConfig.siteURL}${prefix}` || '',
                    siteTitle: fastify.zoiaConfig.siteTitle[req.body.language] || '',
                    title: i18n[subj],
                    preheader: i18n[subj],
                    t: i18n
                },
                resetURL
            }));
            const htmlMail = render.out.stream._content;
            // Send mail
            await rep.sendMail(fastify, email, i18n[subj], htmlMail, '', req.body.language);
            // Send response
            return rep.sendSuccessJSON(rep);
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
