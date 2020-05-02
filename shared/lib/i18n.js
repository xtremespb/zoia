export default class i18n {
    constructor(langs = [], language = "") {
        this._langs = langs;
        this._language = language;
        this._strings = {};
        this._langs.map(lng => this.addLanguage(lng));
    }

    setLanguages(langs) {
        this._langs = langs;
        this._langs.map(lng => this.addLanguage(lng));
    }

    addLanguage(lng) {
        if (this._langs.indexOf(lng) > -1) {
            return;
        }
        this._langs.push(lng);
        this._strings[lng] = {};
    }

    setLanguage(lng) {
        this._language = lng;
    }

    static async loadLanguageDataFromURL(url) {
        try {
            const response = await fetch(url);
            const data = response.json();
            return data;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            return null;
        }
    }

    setLanguageData(language, data) {
        this._strings[language] = data;
    }

    getLanguageData(language) {
        return this._strings[language];
    }

    setLanguageCatalogs(data) {
        this._strings = data;
    }

    getLocalizedURL(path, language) {
        let newURL = path;
        if (newURL) {
            const url = path;
            const urlParts = url.split(/\//);
            if (urlParts.length > 1) {
                const firstPartOfURL = urlParts[1];
                if (this._langs.indexOf(firstPartOfURL) > -1) {
                    urlParts[1] = language;
                    if (urlParts[1] === this._langs[0]) {
                        urlParts.splice(1, 1);
                    }
                    if (urlParts.length === 2 && language !== this._langs[0]) {
                        urlParts[1] = language;
                    }
                } else if (language !== this._langs[0]) {
                    urlParts.splice(1, 0, language);
                }
            }
            newURL = urlParts.join("/") || "/";
        }
        newURL = newURL.length > 1 ? newURL.replace(/\/$/, "") : newURL;
        return newURL;
    }

    t(str, num, params = {}) {
        let strTranslated = this._strings[this._language][str];
        Object.keys(params).map(i => strTranslated = strTranslated.replace(new RegExp(`\${${i}}`, "g"), params[i]));
        return strTranslated;
    }
}
