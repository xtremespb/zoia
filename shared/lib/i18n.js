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

    // static async loadLanguageDataFromPath(filePath) {
    //     try {
    //         const rawData = await fs.readFile(filePath, "utf8");
    //         const data = JSON.parse(rawData);
    //         return data;
    //     } catch (e) {
    //         // eslint-disable-next-line no-console
    //         console.error(e);
    //         return null;
    //     }
    // }

    setLanguageData(language, data) {
        this._strings[language] = data;
    }

    getLanguageData(language) {
        return this._strings[language];
    }

    setLanguageCatalogs(data) {
        this._strings = data;
    }

    t(str, num, params = {}) {
        let strTranslated = this._strings[this._language][str];
        Object.keys(params).map(i => strTranslated = strTranslated.replace(new RegExp(`\${${i}}`, "g"), params[i]));
        return strTranslated;
    }
}
