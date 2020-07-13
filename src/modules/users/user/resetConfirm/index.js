import axios from 'axios';
import { v4 as uuid } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import template from './template.marko';
import templates from '../../../../../dist/etc/templates.json';
import i18n from '../../../../shared/marko/utils/i18n-node';

let config = {};
try {
    config = fs.readJSONSync(path.resolve(`${__dirname}/../etc/user.json`));
} catch {
    // Ignore
}

export default fastify => ({
    config: {
        rateLimit: config.activateRateConfig
    },
    schema: {
        query: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    minLength: 24,
                    maxLength: 24,
                    pattern: '^[0-9a-fA-F]+$'
                },
                code: {
                    type: 'string',
                    minLength: 36,
                    maxLength: 36
                }
            },
            required: ['id', 'code']
        }
    },
    attachValidation: true,
    async handler(req, rep) {
        // Start of Validation
        const {
            validationError
        } = req;
        // End of Validation
        try {
            const siteData = await req.getSiteData(req);
            const t = i18n('users')[siteData.language] || {};
            siteData.title = `${t['Reset password']} | ${siteData.title}`;
            if (!validationError) {
                try {
                    const apiValidationData = await axios.post(`${fastify.zoiaConfig.api.url}/api/users/resetConfirm`, {
                        id: req.query.id,
                        code: req.query.code
                    }, {
                        headers: {
                            'content-type': 'application/json'
                        }
                    });
                    if (apiValidationData.data.statusCode === 200) {
                        return rep.sendRedirect(rep, `${siteData.languagePrefixURL}/users/auth?resetSuccess=true&_=${uuid()}`);
                    }
                } catch (e) {
                    // Ignore
                }
            }
            const render = (await template.render({
                $global: {
                    serializedGlobals: {
                        siteData: true,
                        t: true,
                        cookieOptions: true
                    },
                    siteData,
                    t,
                    cookieOptions: fastify.zoiaConfig.cookieOptions,
                    template: templates.available[0]
                }
            }));
            const html = render.out.stream._content;
            rep.expires(new Date());
            return rep.sendSuccessHTML(rep, html);
        } catch (e) {
            return Promise.reject(e);
        }
    }
});
