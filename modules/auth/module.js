module.exports = function(app) {
    const config = require('../../core/config.js');
    const api = require('./api.js')(app);
    const frontend = require('./frontend.js')(app);
    let configModule;
    try {
        configModule = require('./config/oauth.json');
    } catch (e) {
        configModule = require('./config/oauth.dist.json');
    }
    for (let i in configModule) {
        let ai = configModule[i];
        if (ai.enabled) {
            require(`./oauth/${i}.js`)(app, frontend.routes);
        }
    }
    app.get('log').info('[auth] module loaded');
    return {
        frontend: {
            prefix: config.core.prefix.auth,
            routes: frontend.routes
        },
        api: {
            prefix: '/auth',
            routes: api.routes
        }
    };
};