module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    const frontend = require('./frontend.js')(app);
    app.get('log').info('[support] module loaded');
    return {
        frontend: {
            prefix: '/support',
            routes: frontend.routes,
            filters: frontend.filters
        },
        backend: {
            prefix: '/support',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/support',
            routes: api.routes
        }
    };
};