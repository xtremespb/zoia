import apiLoadConfig from './apiLoadConfig';
import apiLoadSiteData from './apiLoadSiteData';
import apiCaptcha from './apiCaptcha';

export default fastify => {
    fastify.post('/api/core/config/load', apiLoadConfig(fastify));
    fastify.post('/api/core/site/data', apiLoadSiteData(fastify));
    fastify.get('/api/core/captcha', apiCaptcha(fastify));
};
