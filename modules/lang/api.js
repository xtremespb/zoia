const path = require('path');
const Router = require('co-router');
const config = require('../../core/config.js');

module.exports = function(app) {
    const log = app.get('log');
    const modules = app.get('modules');
    let langData = {};
    for (let i in modules) {
        const module = modules[i];
        langData[module] = {};
        for (let j in config.i18n.locales) {
            let locale = config.i18n.locales[j];
            try {
                langData[module][locale] = require(path.join(__dirname, '..', '..', 'modules', module, 'lang', locale + '.json'));
            } catch (e) {
                log.debug('Could not load locale data ' + module + '/' + locale);
            }
        }
    }

    const lang = async(req, res) => {
        const module = req.params.module;
        const lng = req.params.lang;
        res.contentType('text/javascript');
        if (!module || typeof module !== 'string' ||
            !lng || typeof lng !== 'string' ||
            !langData[module] || !langData[module][lng]) {
            return res.send('var lang = {};');
        }
        res.send('var lang = ' + JSON.stringify(langData[module][lng]) + ';');
    };

    let router = Router();
    router.get('/:module/:lang.js', lang);
    return {
        routes: router
    };
};