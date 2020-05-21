// eslint-disable-next-line import/no-extraneous-dependencies
import fs from "fs-extra";
import path from "path";
import I18n from "./i18n";
import i18nCatalogs from "./i18nCatalogsNode";

const config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));

export default class {
    constructor(req, module) {
        this.module = module;
        this.catalogs = i18nCatalogs.getModuleCatalog(module);
        this.language = this.getLocaleFromURL(req);
        this.languagesList = this.catalogs.languages;
        this.languages = config.languages;
        this.path = req.urlData().path;
        this.query = req.urlData().query;
        this.i18n = new I18n(this.languagesList);
        this.i18n.setLanguageCatalogs(this.catalogs.translationData);
        this.serializedGlobals = {
            language: true,
            languages: true,
            languageData: true,
            siteMetadata: true,
            siteOptions: true,
            path: true,
            cookieOptions: true,
            authData: true
        };
        this.i18n.setLanguage(this.language);
    }

    setAuth(auth) {
        this.authData = auth ? auth.getUser() : {};
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
            languages: this.languages,
            languageData: this.i18n.getLanguageData(this.language),
            i18n: this.i18n,
            siteMetadata: config.siteMetadata[this.language],
            siteOptions: config.siteOptions,
            path: this.path,
            cookieOptions: config.cookieOptions,
            authData: this.authData
        };
    }
}
