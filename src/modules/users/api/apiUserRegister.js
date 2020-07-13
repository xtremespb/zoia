import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import mailRegister from '../email/register/index.marko';
import I18N from '../../../shared/marko/utils/i18n-node';

export default fastify => ({
    schema: {
        body: {
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    minLength: 4,
                    maxLength: 32,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
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
            required: ['username', 'password', 'email', 'captcha', 'captchaSecret']
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
            // If registration is not allowed, stop
            if (!fastify.zoiaConfig.allowRegistration) {
                return rep.sendBadRequestError(rep, 'Registration is not allowed');
            }
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
            const username = req.body.username.toLowerCase();
            const email = req.body.email.toLowerCase();
            const usernameDB = await this.mongo.db.collection('users').findOne({
                username
            });
            if (usernameDB) {
                return rep.sendBadRequestError(rep, 'User already registered', {
                    default: {
                        username: ''
                    }
                }, 2);
            }
            const emailDB = await this.mongo.db.collection('users').findOne({
                email
            });
            if (emailDB) {
                return rep.sendBadRequestError(rep, 'E-mail already registered', {
                    default: {
                        email: ''
                    }
                }, 3);
            }
            // Save new user to the database
            const activationCode = uuid();
            const registrationDate = parseInt(new Date().getTime() / 1000, 10);
            const password = crypto.createHmac('sha512', fastify.zoiaConfigSecure.secret).update(req.body.password).digest('hex');
            const insResult = await this.mongo.db.collection('users').insertOne({
                username,
                active: false,
                admin: false,
                email,
                password,
                activationCode,
                registrationDate
            });
            if (!insResult || !insResult.result || !insResult.result.ok || !insResult.insertedId) {
                return rep.sendBadRequestError(rep, 'Could not insert a database record');
            }
            // Send e-mail message
            const prefix = req.getPrefixForLanguage(req.body.language, fastify);
            const registrationURL = `${fastify.zoiaConfig.siteURL}${prefix}/users/activate?id=${insResult.insertedId}&code=${activationCode}`;
            const subj = 'New account registration';
            const render = (await mailRegister.render({
                $global: {
                    siteURL: `${fastify.zoiaConfig.siteURL}${prefix}` || '',
                    siteTitle: fastify.zoiaConfig.siteTitle[req.body.language] || '',
                    title: i18n[subj],
                    preheader: i18n[subj],
                    t: i18n
                },
                registrationURL
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
