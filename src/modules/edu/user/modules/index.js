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
                return rep.sendRedirect(rep, `${siteData.languagePrefixURL}users/auth?redirect=${siteData.languagePrefixURL}/edu/modules&&_=${uuid()}`);
            }
            let data;
            try {
                const dataReply = await axios.post(`${fastify.zoiaConfig.api.url}/api/edu/data`, {
                    token,
                    program: req.params.program
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
            let statusData;
            try {
                const statusReply = await axios.post(`${fastify.zoiaConfig.api.url}/api/edu/status`, {
                    token,
                    program: req.params.program
                }, {
                    headers: {
                        'content-type': 'application/json'
                    }
                });
                if (statusReply && statusReply.data && statusReply.data.statusCode === 200 && statusReply.data.status) {
                    statusData = statusReply.data.status;
                }
            } catch (e) {
                // Ignore
            }
            if (!data || !data.programs) {
                rep.callNotFound();
                return rep.code(204);
            }
            const currentProgram = data.programs.avail.find(p => p.id === req.params.program);
            siteData.title = `${currentProgram.title} | ${siteData.title}`;
            const render = (await template.render({
                $global: {
                    serializedGlobals: {
                        siteData: true,
                        t: true,
                        cookieOptions: true,
                        data: true,
                        statusData: true,
                        program: true
                    },
                    siteData,
                    statusData,
                    t,
                    cookieOptions: fastify.zoiaConfig.cookieOptions,
                    template: templates.available[0],
                    data,
                    program: req.params.program,
                    programTitle: currentProgram.title,
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
