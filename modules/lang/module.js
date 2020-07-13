module.exports = function(app) {
    const api = require('./api.js')(app);
    const frontend = require('./frontend.js')(app);
    app.get('log').info('[lang] module loaded');
    return {
        frontend: {
            prefix: '/',
            filters: frontend.filters
        },
        api: {
            prefix: '/lang',
            routes: api.routes
        }
    };
};