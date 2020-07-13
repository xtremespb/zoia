export default {
    getLocaleFromURL: req => {
        const languages = Object.keys(req.zoiaConfig.languages);
        if (req && req.urlData()) {
            const url = req.urlData().path;
            const urlParts = url.split(/\//);
            if (urlParts.length > 1) {
                const firstPartOfURL = urlParts[1];
                if (languages.indexOf(firstPartOfURL) > -1) {
                    return firstPartOfURL;
                }
            }
        }
        return languages[0];
    },
    getSiteTitle: (language, req) => req.zoiaConfig.siteTitle[language],
    getLocaleURL: (language, req) => {
        const languages = Object.keys(req.zoiaConfig.languages);
        let newURL = req && req.urlData() ? req.urlData().path : null;
        if (newURL) {
            const url = req.urlData().path;
            const urlParts = url.split(/\//);
            if (urlParts.length > 1) {
                const firstPartOfURL = urlParts[1];
                if (languages.indexOf(firstPartOfURL) > -1) {
                    urlParts[1] = language;
                    if (urlParts[1] === languages[0]) {
                        urlParts.splice(1, 1);
                    }
                    if (urlParts.length === 2 && language !== languages[0]) {
                        urlParts[1] = language;
                    }
                } else if (language !== languages[0]) {
                    urlParts.splice(1, 0, language);
                }
            }
            newURL = urlParts.join('/') || '/';
        }
        newURL = newURL.length > 1 ? newURL.replace(/\/$/, '') : newURL;
        return newURL;
    },
    getNonLocalizedURL: req => {
        const languages = Object.keys(req.zoiaConfig.languages);
        const data = {};
        if (req && req.urlData()) {
            const url = req.urlData().path;
            const urlParts = url.split(/\//);
            if (urlParts.length > 1) {
                const firstPartOfURL = urlParts[1];
                if (languages.indexOf(firstPartOfURL) > -1) {
                    [data.language] = urlParts.splice(1, 1);
                } else {
                    [data.language] = languages;
                }
                data.url = urlParts.join('/') || '/';
                data.url = data.url.length > 1 ? data.url.replace(/\/$/, '') : data.url;
            }
        }
        return data;
    },
    getPrefixForLanguage: (lang, fastify) => {
        const languages = Object.keys(fastify.zoiaConfig.languages);
        return lang === languages[0] ? '' : `/${lang}`;
    }
};
