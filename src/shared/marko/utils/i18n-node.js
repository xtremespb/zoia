const modules = require('../../build/modules.json');
const config = require('../../../../dist/static/etc/config.json');

const catalogs = {};
const generic = {};
// Get data for "Generic" loclaes which shall be included with every other locale
Object.keys(config.languages).map(language => {
    try {
        const catalog = require(`../../marko/locales/${language}.json`);
        // If there is no translation, replace it with key
        Object.keys(catalog).map(k => catalog[k] = catalog[k] || k);
        generic[language] = catalog;
    } catch (e) {
        // Ignore
    }
});
// Get locales for every module
Object.keys(modules).map(m => {
    catalogs[m] = {};
    Object.keys(config.languages).map(language => {
        try {
            const catalog = require(`../../../modules/${m}/user/locales/${language}.json`);
            // If there is no translation, replace it with key
            Object.keys(catalog).map(k => catalog[k] = catalog[k] || k);
            catalogs[m][language] = {
                ...generic[language],
                ...catalog
            };
        } catch (e) {
            // Ignore
        }
        if (!catalogs[m][language]) {
            catalogs[m][language] = {
                ...generic[language]
            };
        }
    });
});
// Export
export default module => module ? catalogs[module] : generic;
