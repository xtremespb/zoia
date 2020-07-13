module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    const frontend = require('./frontend.js')(app);
    app.get('log').info('[pages] module loaded');
    return {
        frontend: {
            prefix: '/',
            routes: frontend.routes,
            filters: frontend.filters
        },
        backend: {
            prefix: '/pages',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/pages',
            routes: api.routes
        }
    };
};