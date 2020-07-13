module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    const frontend = require('./frontend.js')(app);
    app.get('log').info('[reviews] module loaded');
    return {
        frontend: {
            prefix: '/reviews',
            routes: frontend.routes,
            filters: frontend.filters
        },
        backend: {
            prefix: '/reviews',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/reviews',
            routes: api.routes
        }
    };
};