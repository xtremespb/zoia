module.exports = function(app) {
    const backend = require('./backend.js')(app);
    const api = require('./api.js')(app);
    app.get('log').info('[dashboard] module loaded');
    return {
        backend: {
            prefix: '/',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/dashboard',
            routes: api.routes
        }
    };
};