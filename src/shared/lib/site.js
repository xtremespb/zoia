// eslint-disable-next-line import/no-extraneous-dependencies
import I18n from "./i18n";

let i18nCatalogs;
if (!process.browser) {
    i18nCatalogs = require("./i18nCatalogs").default;
}
// eslint-disable-next-line import/no-unresolved

export default class {
    constructor(req, module, db) {
        req.zoiaModulesConfig = req.zoiaModulesConfig || {};
        this.moduleConfigUsers = req.zoiaModulesConfig["users"];
        this.moduleConfigAdmin = req.zoiaModulesConfig["core"];
        this.module = module;
        this.catalogs = i18nCatalogs.getModuleCatalog(module);
        this.language = this.getLocaleFromURL(req);
        this.config = req.zoiaConfig || {};
        this.siteMetadata = req.siteMetadata || this.config ? this.config.siteMetadata : null || {};
        this.languagesList = this.catalogs.languages;
        this.languages = this.config.languages;
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
            siteId: true,
            path: true,
            query: true,
            cookieOptions: true,
            authData: true,
            login: true,
            logout: true,
            admin: true,
            navData: true,
            publicFiles: true,
            publicImages: true,
            demoMode: true,
            commonTableItemsLimit: true,
            version: true,
        };
        this.req = req;
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
        })) || this.config.siteMetadata;
        const demoData = await this.db.collection(this.config.collections.registry).findOne({
            _id: "core_demo"
        });
        return {
            language: this.language,
            languages: this.languages,
            languageData: this.i18n.getLanguageData(this.language),
            i18n: this.i18n,
            siteMetadata: siteMetadata[this.language],
            siteId: this.config.id,
            path: this.path,
            query: this.query,
            cookieOptions: this.config.cookieOptions,
            authData: this.authData,
            login: this.moduleConfigUsers ? this.moduleConfigUsers.routes.login : null,
            logout: this.moduleConfigUsers ? this.moduleConfigUsers.routes.logout : null,
            admin: this.moduleConfigAdmin ? this.moduleConfigAdmin.routes.core : null,
            navData: navData ? navData.tree : [],
            publicFiles: this.config.routes.publicFiles,
            publicImages: this.config.routes.publicImages,
            demoMode: demoData && demoData.status,
            commonTableItemsLimit: this.config.commonTableItemsLimit,
            version: this.req.zoiaVersion,
        };
    }
}
