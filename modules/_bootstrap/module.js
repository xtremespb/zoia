module.exports = function(app) {
	app.get('log').info('[bootstrap] module loaded');
    return {
        frontend: {
        }
    };
};