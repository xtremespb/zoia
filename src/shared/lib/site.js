/* eslint-disable no-param-reassign */
import axios from 'axios';
import locale from './locale';

const loopPath = (data, keyPath, language, callback, path = [], pathData = []) => data.forEach(item => {
    path.push(item.id);
    pathData.push({
        id: item.id,
        title: item.data[language] ? item.data[language].title : ''
    });
    if (keyPath === path.join('/')) {
        callback(pathData);
    } else if (item.children) {
        loopPath(item.children, keyPath, language, callback, path, pathData);
    }
    path.pop();
    pathData.pop();
});

export default {
    getSiteData: async (req, pageData, preloadedData) => {
        try {
            const siteData = {
                nav: null,
                user: {}
            };
            const token = req.cookies[`${req.zoiaConfig.id}_auth`];
            if (!preloadedData || !preloadedData.nav || !preloadedData.user) {
                try {
                    const apiSiteData = await axios.post(`${req.zoiaConfig.api.url}/api/core/site/data`, {
                        token,
                        nav: true,
                        user: true
                    }, {
                        headers: {
                            'content-type': 'application/json'
                        }
                    });
                    siteData.nav = apiSiteData.data.nav;
                    siteData.user = apiSiteData.data.user || {};
                } catch (e) {
                    throw new Error(e);
                }
            } else {
                siteData.nav = preloadedData.nav;
                siteData.user = preloadedData.user;
            }
            const languagesArr = Object.keys(req.zoiaConfig.languages);
            const {
                languages
            } = req.zoiaConfig;
            const language = locale.getLocaleFromURL(req);
            const languagePrefixURL = language === Object.keys(req.zoiaConfig.languages)[0] ? '' : `/${language}`;
            const languagePrefix = language === Object.keys(req.zoiaConfig.languages)[0] ? '' : `${language}`;
            const title = locale.getSiteTitle(language, req);
            const redirectURL = req.query.redirect;
            const currentPath = req.urlData().path;
            const languagesURL = {};
            let breadcrumbsHTML = '';
            if (pageData && pageData.folders && pageData.folders.data && pageData.filename) {
                const {
                    url
                } = locale.getNonLocalizedURL(req);
                const urlParts = url.split(/\//).filter(i => i.length > 0);
                if (pageData.filename && urlParts.length && urlParts[urlParts.length - 1] === pageData.filename) {
                    urlParts.pop();
                }
                loopPath(pageData.folders.data, urlParts.join('/'), language, breadcrumbsData => {
                    let breadcrumbsCurrentPath = '';
                    breadcrumbsHTML = breadcrumbsData.map(b => {
                        const bu = b;
                        breadcrumbsCurrentPath = `${breadcrumbsCurrentPath}/${b.id}`;
                        bu.url = breadcrumbsCurrentPath;
                        return bu;
                    }).map(b => `<li><a href="${languagePrefixURL}${b.url}">${b.title}</a></li>`).join('');
                });
            }
            breadcrumbsHTML = `<li><a href="${languagePrefixURL || '/'}">${title}</a></li>${breadcrumbsHTML}`;
            const navTree = (siteData.nav ? siteData.nav.data || [] : []).map(i => {
                const item = i;
                item.url = item.url.match(/^http/) ? item : `${languagePrefixURL}${item.url}`;
                return item;
            });
            languagesArr.map(lang => languagesURL[lang] = locale.getLocaleURL(lang, req));
            return {
                ...siteData,
                navTree,
                language,
                languagePrefixURL,
                languagePrefix,
                languages,
                languagesArr,
                languagesURL,
                redirectURL,
                currentPath,
                title,
                breadcrumbsHTML,
                useUIkitOnFrontend: req.zoiaConfig.useUIkitOnFrontend || false,
                allowRegistration: req.zoiaConfig.allowRegistration,
                allowSignIn: req.zoiaConfig.allowSignIn,
                siteId: req.zoiaConfig.id,
                api: req.zoiaConfig.api.url
            };
        } catch (e) {
            throw new Error(e);
        }
    }
};
