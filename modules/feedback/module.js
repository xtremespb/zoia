module.exports = function(app) {
    const api = require('./api.js')(app);
    const frontend = require('./frontend.js')(app);
    let configModule;
    try {
        configModule = require('./config/feedback.json');
    } catch (e) {
        configModule = require('./config/feedback.dist.json');
    }
    app.get('log').info('[feedback] module loaded');
    return {
        frontend: {
            prefix: configModule.prefix.feedback,
            routes: frontend.routes
        },
        api: {
            prefix: '/feedback',
            routes: api.routes
        }
    };
};