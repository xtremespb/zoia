module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    app.get('log').info('[groups] module loaded');
    return {
        backend: {
            prefix: '/groups',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/groups',
            routes: api.routes
        }
    };
};