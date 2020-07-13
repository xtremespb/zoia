module.exports = function(app) {
    const backend = require('./backend.js')(app);
    const api = require('./api.js')(app);
    app.get('log').info('[backup] module loaded');
    return {
        backend: {
            prefix: '/backup',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/backup',
            routes: api.routes
        }
    };
};