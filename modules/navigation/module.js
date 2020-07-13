module.exports = function(app) {
    const api = require('./api.js')(app);
    const frontend = require('./frontend.js')(app);
    const backend = require('./backend.js')(app);
    app.get('log').info('[navigation] module loaded');
    return {
        frontend: {
            prefix: '/',
            filters: frontend.filters
        },
        backend: {
            prefix: '/navigation',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/navigation',
            routes: api.routes
        }
    };
};