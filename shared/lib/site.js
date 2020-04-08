import fs from "fs-extra";
import path from "path";
import I18n from "./i18n";
import i18nCatalogs from "./i18nCatalogsNode";

const config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));

export default class {
    constructor(req, module) {
        this.module = module;
        this.catalogs = i18nCatalogs(module);
        this.language = this.getLocaleFromURL(req);
        this.languages = this.catalogs.languages;
        this.i18n = new I18n(this.languages);
        this.i18n.setLanguageCatalogs(this.catalogs.translationData);
        this.siteData = config.site;
        this.serializedGlobals = {
            language: true,
            languageData: true,
            siteData: true,
        };
        this.i18n.setLanguage(this.language);
    }

    getLocaleFromURL(req) {
        const {
            languages
        } = this.catalogs;
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
    }

    getSerializedGlobals() {
        return this.serializedGlobals;
    }

    getGlobals() {
        return {
            language: this.language,
            languageData: this.i18n.getLanguageData(this.language),
            i18n: this.i18n,
            siteData: this.siteData[this.language]
        };
    }
}
