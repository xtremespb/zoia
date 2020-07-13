import template from './template.marko';
import templates from '../../../../../dist/etc/templates.json';
import i18n from '../../../../shared/marko/utils/i18n-node';

export default fastify => ({
    async handler(req, rep) {
        try {
            const siteData = await req.getSiteData(req);
            const t = i18n('users')[siteData.language] || {};
            siteData.title = `${t['Authorize']} | ${siteData.title}`;
            siteData.activationSuccess = req.query.activationSuccess ? true : null;
            siteData.resetSuccess = req.query.resetSuccess ? true : null;
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
