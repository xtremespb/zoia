module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    const frontend = require('./frontend.js')(app);
    let configModule;
    try {
        configModule = require('./config/blog.json');
    } catch (e) {
        configModule = require('./config/blog.dist.json');
    }
    app.get('log').info('[blog] module loaded');
    return {
        frontend: {
            prefix: configModule.prefix.blog,
            routes: frontend.routes,
            filters: frontend.filters
        },
        backend: {
            prefix: '/blog',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/blog',
            routes: api.routes
        }
    };
};