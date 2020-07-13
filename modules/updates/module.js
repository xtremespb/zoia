module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    app.get('log').info('[updates] module loaded');
    return {
        backend: {
            prefix: '/updates',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/updates',
            routes: api.routes
        }
    };
};