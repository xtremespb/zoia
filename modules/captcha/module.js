module.exports = function(app) {
    const api = require('./api.js')(app);
    app.get('log').info('[captcha] module loaded');
    return {
        api: {
            prefix: '/captcha',
            routes: api.routes
        }
    };
};
