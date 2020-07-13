import site from '../../lib/site';
import error404 from '../error404/index.marko';

export default async (req, rep, i18n, templates) => {
    const siteData = await site.getSiteData(req);
    const t = i18n()[siteData.language || Object.keys(req.zoiaConfig.languages)[0]];
    siteData.title = `${t['Not Found']} | ${siteData.title}`;
    const render = await error404.render({
        $global: {
            siteData,
            t,
            template: templates.available[0]
        }
    });
    rep.code(404).type('text/html').send(render.out.stream._content);
};
