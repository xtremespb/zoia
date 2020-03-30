import fs from "fs-extra";
import path from "path";
import I18n from "./i18n";
import i18nCatalogs from "./i18nCatalogsNode";

const {
    languages,
    translationData
} = i18nCatalogs();
const i18n = new I18n(languages);
i18n.setLanguageCatalogs(translationData);
const config = fs.readJSONSync(path.resolve(`${__dirname}/../../etc/zoia.json`));

export default {
    i18n,
    languages,
    translationData,
    siteData: config.site,
    serializedGlobals: {
        language: true,
        languageData: true,
        siteData: true,
    },
    globals: language => ({
        language,
        languageData: i18n.getLanguageData(language),
        i18n,
        siteData: config.site
    })
};
