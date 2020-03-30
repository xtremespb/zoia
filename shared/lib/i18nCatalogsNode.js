const config = require(`../../etc/zoia.json`);
const modules = require(`../../etc/modules.json`);
const languages = Object.keys(config.languages);
const catalogs = {};
const generic = {};

languages.map(language => {
    try {
        const catalog = require(`../locales/${language}.json`);
        Object.keys(catalog).map(k => catalog[k] = catalog[k] || k);
        generic[language] = catalog;
    } catch (e) {
        // Ignore
    }
});

Object.keys(modules).map(m => {
    catalogs[m] = {};
    languages.map(language => {
        try {
            const catalog = require(`../../modules/${m}/locales/${language}.json`);
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

export default module => module ? ({
    languages,
    translationData: catalogs[module]
}) : ({
    languages,
    translationData: generic
});
