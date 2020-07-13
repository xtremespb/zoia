module.exports = function(app) {
    const api = require('./api.js')(app);
    const frontend = require('./frontend.js')(app);
    let configModule;
    try {
        configModule = require('./config/brief.json');
    } catch (e) {
        configModule = require('./config/brief.dist.json');
    }
    app.get('log').info('[brief] module loaded');
    return {
        frontend: {
            prefix: configModule.prefix.brief,
            routes: frontend.routes
        },
        api: {
            prefix: '/brief',
            routes: api.routes
        }
    };
};