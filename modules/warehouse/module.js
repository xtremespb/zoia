module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    const frontend = require('./frontend.js')(app);
    let configModule;
    try {
        configModule = require('./config/catalog.json');
    } catch (e) {
        configModule = require('./config/catalog.dist.json');
    }
    if (configModule.payments && configModule.payments.enabled) {
        try {
            require(`./plugins/${configModule.payments.plugin}/routes`)(app, frontend.routes);
        } catch (e) {
            app.get('log').error('Could not load payments plugin: ' + e);
        }
    }
    app.get('log').info('[warehouse] module loaded');
    return {
        frontend: {
            prefix: configModule.prefix,
            routes: frontend.routes
        },
        backend: {
            prefix: '/warehouse',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/warehouse',
            routes: api.routes
        }
    };
};