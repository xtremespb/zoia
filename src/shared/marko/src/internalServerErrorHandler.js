import error500 from '../error500/index.marko';
import site from '../../lib/site';

export default async (err, req, rep, i18n, templates, secure) => {
    let siteData = {};
    try {
        siteData = await site.getSiteData(req);
    } catch (e) {
        // Ignore
    }
    const t = i18n()[siteData.language || Object.keys(req.zoiaConfig.languages)[0]];
    let statusCode = 500;
    if (err && err.response && err.response.data && err.response.data.statusCode === 429) {
        statusCode = 429;
        siteData.title = `${t['Too Many Requests']}${siteData.title ? ` | ${siteData.title}` : ''}`;
    } else {
        siteData.title = `${t['Internal Server Error']}${siteData.title ? ` | ${siteData.title}` : ''}`;
    }
    const render = await error500.render({
        $global: {
            siteData,
            t,
            template: templates.available[0],
            statusCode
        }
    });
    req.log.error({
        ip: req.ip,
        path: req.urlData().path,
        query: req.urlData().query,
        error: err && err.message ? err.message : 'Internal Server Error',
        stack: secure.stackTrace && err.stack ? err.stack : null
    });
    if (rep) {
        return rep.code(500).type('text/html').send(render.out.stream._content);
    }
    return render.out.stream._content;
};
