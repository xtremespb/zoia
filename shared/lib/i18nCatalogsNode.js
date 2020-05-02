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

modules.map(m => {
    catalogs[m.id] = {};
    languages.map(language => {
        try {
            const catalog = require(`../../modules/${m.id}/locales/${language}.json`);
            Object.keys(catalog).map(k => catalog[k] = catalog[k] || k);
            catalogs[m.id][language] = {
                ...generic[language],
                ...catalog
            };
        } catch (e) {
            // Ignore
        }
        if (!catalogs[m.id][language]) {
            catalogs[m.id][language] = {
                ...generic[language]
            };
        }
    });
});

export default {
    getModuleCatalog: module => module ? ({
        languages,
        translationData: catalogs[module]
    }) : ({
        languages,
        translationData: generic
    }),
    getAllModuleCatalogs: () => catalogs
};
