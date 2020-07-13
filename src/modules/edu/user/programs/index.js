import axios from 'axios';
import { v4 as uuid } from 'uuid';
import template from './template.marko';
import templates from '../../../../../dist/etc/templates.json';
import i18n from '../../../../shared/marko/utils/i18n-node';

export default fastify => ({
    async handler(req, rep) {
        try {
            const siteData = await req.getSiteData(req);
            const t = i18n('edu')[siteData.language] || {};
            const token = req.cookies[`${fastify.zoiaConfig.id}_auth`];
            if (!token) {
                return rep.sendRedirect(rep, `${siteData.languagePrefixURL}users/auth?redirect=${siteData.languagePrefixURL}/edu&&_=${uuid()}`);
            }
            let data;
            try {
                const dataReply = await axios.post(`${fastify.zoiaConfig.api.url}/api/edu/data`, {
                    token
                }, {
                    headers: {
                        'content-type': 'application/json'
                    }
                });
                if (dataReply && dataReply.data && dataReply.data.statusCode === 200 && dataReply.data.data) {
                    data = dataReply.data.data;
                }
            } catch (e) {
                // Ignore
            }
            siteData.title = `${t['Programs']} | ${siteData.title}`;
            const render = (await template.render({
                $global: {
                    serializedGlobals: {
                        siteData: true,
                        t: true,
                        cookieOptions: true,
                        data: true
                    },
                    siteData,
                    data,
                    t,
                    cookieOptions: fastify.zoiaConfig.cookieOptions,
                    template: templates.available[0],
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
