// eslint-disable-next-line import/no-extraneous-dependencies
import fs from "fs-extra";
import path from "path";
import I18n from "./i18n";
import i18nCatalogs from "./i18nCatalogsNode";
// eslint-disable-next-line import/no-unresolved

const config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));

export default class {
    constructor(req, module, db) {
        this.moduleConfigUsers = req.zoiaModulesConfig["users"];
        this.moduleConfigAdmin = req.zoiaModulesConfig["core"];
        this.module = module;
        this.catalogs = i18nCatalogs.getModuleCatalog(module);
        this.language = this.getLocaleFromURL(req);
        this.config = req.zoiaConfig;
        this.siteMetadata = req.siteMetadata || config.siteMetadata;
        this.languagesList = this.catalogs.languages;
        this.languages = config.languages;
        this.path = req.urlData().path;
        this.query = req.urlData().query;
        this.i18n = new I18n(this.languagesList);
        this.i18n.setLanguageCatalogs(this.catalogs.translationData);
        this.db = db;
        this.serializedGlobals = {
            language: true,
            languages: true,
            languageData: true,
            siteMetadata: true,
            siteOptions: true,
            path: true,
            query: true,
            cookieOptions: true,
            authData: true,
            login: true,
            logout: true,
            admin: true,
            navData: true,
            publicFiles: true,
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

    async getGlobals() {
        const navData = await this.db.collection(this.config.collections.registry).findOne({
            _id: "nav_data"
        });
        const siteMetadata = (await this.db.collection(this.config.collections.registry).findOne({
            _id: "site_metadata"
        })) || config.siteMetadata;
        return {
            language: this.language,
            languages: this.languages,
            languageData: this.i18n.getLanguageData(this.language),
            i18n: this.i18n,
            siteMetadata: siteMetadata[this.language],
            siteOptions: config.siteOptions,
            path: this.path,
            query: this.query,
            cookieOptions: config.cookieOptions,
            authData: this.authData,
            login: this.moduleConfigUsers.routes.login,
            logout: this.moduleConfigUsers.routes.logout,
            admin: this.moduleConfigAdmin.routes.admin,
            navData: navData ? navData.tree : [],
            publicFiles: config.routes.publicFiles
        };
    }
}
