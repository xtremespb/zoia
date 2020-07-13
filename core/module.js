const path = require('path');
const config = require(path.join(__dirname, 'config.js'));
const natural = require('natural');

const illegalRe = /[\/\?<>\\:\*\|":]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const windowsTrailingRe = /[\. ]+$/;

const isLeadSurrogate = (code) => {
    if (code === -1) {
        return false;
    }
    return (code & 0xfc00) === 0xd800;
};

const isTrailSurrogate = (code) => {
    if (code === -1) {
        return false;
    }
    return (code & 0xdfff) === 0xdc00;
};

const truncate = (string, limit) => {
    if (string.length * 4 < limit) {
        return string;
    }
    let len = 0;
    let previous = -1;
    for (let i = 0; i < string.length; i++) {
        const code = string.charCodeAt(i);
        if (code <= 0x7f) {
            len++;
        } else if (code <= 0x7ff) {
            len += 2;
        } else if (isTrailSurrogate(code) && isLeadSurrogate(previous)) {
            len += 1;
        } else {
            len += 3;
        }
        if (len > limit) {
            if (isTrailSurrogate(code) && isLeadSurrogate(previous)) {
                return string.slice(0, i - 1);
            }
            return string.slice(0, i);
        }
        previous = code;
    }
    return string;
};

module.exports = class Module {
    constructor(app) {
        this.app = app;
    }
    static getTitles(i18n) {
        let titles = {};
        for (let i in config.i18n.locales) {
            titles[config.i18n.locales[i]] = i18n.get().__(config.i18n.locales[i], 'title');
        }
        return titles;
    }
    static isAuthorized(req) {
        if (req && req.session && req.session.auth && req.session.auth._id && req.session.auth.status && parseInt(req.session.auth.status, 10) >= 1) {
            return true;
        }
        return false;
    }
    static isAuthorizedAdmin(req) {
        if (req && req.session && req.session.auth && req.session.auth._id && req.session.auth.groups) {
            const groups = req.session.auth.groups.split(',');
            if (groups.indexOf('admin') > -1 && req.session.auth.status && String(req.session.auth.status) === '1') {
                return true;
            }
        }
        return false;
    }
    static logout(req) {
        if (req && req.session) {
            req.session.auth = undefined;
        }
    }
    static sanitizeFilename(str) {
        const replacement = '';
        const sanitized = str
            .replace(illegalRe, replacement)
            .replace(controlRe, replacement)
            .replace(reservedRe, replacement)
            .replace(windowsReservedRe, replacement)
            .replace(windowsTrailingRe, replacement);
        return truncate(sanitized, 200);
    }
    static sanitizeString(str, len) {
        const replacement = '';
        const sanitized = str
            .replace(illegalRe, replacement)
            .replace(controlRe, replacement)
            .replace(reservedRe, replacement)
        return truncate(sanitized, len);
    }
    static stem(str, locale) {
        natural.PorterStemmer.attach();
        let words = str.tokenizeAndStem();
        if (locale !== 'en') {
            let stop = false;
            switch (locale) {
                case 'ru':
                    natural.PorterStemmerRu.attach();
                    break;
                case 'es':
                    natural.PorterStemmerEs.attach();
                    break;
                case 'fr':
                    natural.PorterStemmerFr.attach();
                    break;
                case 'it':
                    natural.PorterStemmerIt.attach();
                    break;
                case 'no':
                    natural.PorterStemmerNo.attach();
                    break;
                case 'pt':
                    natural.PorterStemmerPt.attach();
                    break;
                case 'sv':
                    natural.PorterStemmerSv.attach();
                    break;
                default:
                    stop = true;
            }
            if (!stop) {
                words = words.concat(str.tokenizeAndStem());
            }
        }
        return words;
    }
};