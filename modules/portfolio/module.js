module.exports = function(app) {
    const frontend = require('./frontend.js')(app);
    let configModule;
    try {
        configModule = require('./config/portfolio.json');
    } catch (e) {
        configModule = require('./config/portfolio.dist.json');
    }
    app.get('log').info('[portfolio] module loaded');
    return {
        frontend: {
            prefix: configModule.prefix,
            routes: frontend.routes,
            filters: frontend.filters
        }
    };
};