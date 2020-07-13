module.exports = function(app) {
    const api = require('./api.js')(app);
    const backend = require('./backend.js')(app);
    const frontend = require('./frontend.js')(app);
    let configModule;
    try {
        configModule = require('./config/hosting.json');
    } catch (e) {
        configModule = require('./config/hosting.dist.json');
    }
    if (configModule.paymentPlugin) {
        try {
            require(`./plugins_payment/${configModule.paymentPlugin}.js`)(app, frontend.routes);
        } catch (e) {
            app.get('log').error('Could not load payments plugin: ' + e);
        }
    }
    app.get('log').info('[hosting] module loaded');
    return {
        frontend: {
            prefix: '/customer',
            routes: frontend.routes,
            filters: frontend.filters
        },
        backend: {
            prefix: '/hosting',
            routes: backend.routes,
            info: backend.info
        },
        api: {
            prefix: '/hosting',
            routes: api.routes
        }
    };
};