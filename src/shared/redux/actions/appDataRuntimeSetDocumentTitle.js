export default (documentTitle, language, siteTitle = {}) => () => {
    document.title = `${documentTitle} | ${siteTitle[language] || ''}`;
};
