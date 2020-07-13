import Ajv from 'ajv';
import {
    ObjectId
} from 'mongodb';
import {
    minify
} from 'html-minifier';
import Typograf from 'typograf';

const ajv = new Ajv();

const formValidate = ajv.compile({
    type: 'object',
    properties: {
        path: {
            type: 'string',
            maxLength: 128
        },
        filename: {
            type: 'string',
            maxLength: 128
        },
        template: {
            type: 'string',
            maxLength: 64
        }
    },
    required: ['path', 'filename']
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
            const formDataValidation = formValidate(formData);
            if (!formDataValidation || (formData.id && (typeof formData.id !== 'string' || !formData.id.match(/^[a-f0-9]+$/)))) {
                const errorData = {
                    form: formDataValidation ? null : (formValidate.errors || {
                        error: 'General validation error'
                    })
                };
                rep.logError(req, errorData);
                return rep.sendBadRequestException(rep, 'Request validation error', errorData);
            }
            const id = formData.id || null;
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
            // Check if such page exists
            if (id) {
                const page = await this.mongo.db.collection('pages').findOne({
                    _id: new ObjectId(id)
                });
                if (!page) {
                    return rep.sendNotFoundError(rep, 'Page not found');
                }
            }
            // Build JSON
            const pageData = {
                filename: formData.filename,
                path: formData.path,
                template: formData.template,
                data: {}
            };
            // Check for duplicates
            const pathReduced = pageData.path.split(/\//).slice(0, -1).join('/') || '/';
            const pathPopped = pageData.path.split(/\//).pop() || '';
            const duplicatePageQuery = {
                $or: [{
                    path: pageData.path,
                    filename: pageData.filename
                }],
            };
            if (pageData.filename) {
                duplicatePageQuery.$or.push({
                    path: `${pageData.path}/${pageData.filename}`,
                    filename: ''
                });
            }
            if (pathPopped && !pageData.filename) {
                duplicatePageQuery.$or.push({
                    path: pathReduced,
                    filename: pathPopped
                });
            }
            if (id) {
                duplicatePageQuery._id = {
                    $ne: new ObjectId(id)
                };
            }
            const duplicatePage = await this.mongo.db.collection('pages').findOne(duplicatePageQuery);
            if (duplicatePage) {
                return rep.sendBadRequestError(rep, 'Page with such path or filename already exists', null, 1);
            }
            Object.keys(req.zoiaConfig.languages).map(language => {
                if (formData[language]) {
                    let contentCompiled = formData[language].content;
                    if (formData[language].extras.indexOf('typo') > -1) {
                        const locale = [];
                        if (language !== 'en') {
                            locale.push(language);
                        }
                        locale.push('en-US');
                        contentCompiled = new Typograf({
                            locale
                        }).execute(formData[language].content);
                    }
                    if (formData[language].extras.indexOf('minify') > -1) {
                        contentCompiled = minify(contentCompiled, {
                            caseSensitive: true,
                            decodeEntities: true,
                            html5: true,
                            collapseWhitespace: true,
                            removeComments: true,
                            removeRedundantAttributes: true
                        });
                    }
                    pageData.data[language] = {
                        title: formData[language].title,
                        content: formData[language].content,
                        contentCompiled
                    };
                }
            });
            pageData.fullPath = `${pageData.path.length > 1 ? pageData.path : ''}/${pageData.filename}`;
            pageData.fullPath = pageData.fullPath.length > 1 ? pageData.fullPath.replace(/\/$/, '') : pageData.fullPath;
            if (fastify.zoiaConfig.demo && pageData.fullPath === '/') {
                return rep.sendSuccessJSON(rep);
            }
            // Update page
            const update = await this.mongo.db.collection('pages').updateOne(id ? {
                _id: new ObjectId(id)
            } : {
                filename: pageData.filename,
                path: pageData.path,
            }, {
                $set: pageData
            }, {
                upsert: true
            });
            // Check result
            if (!update || !update.result || !update.result.ok) {
                return rep.sendBadRequestError(rep, 'Cannot update page record');
            }
            return rep.sendSuccessJSON(rep);
        } catch (e) {
            rep.logError(req, null, e);
            return rep.sendInternalServerError(rep, e.message);
        }
    }
});
