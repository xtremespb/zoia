/**
 * @author  John Resig <jeresig@gmail.com>
 * @author  Originally by Marcus Spiegel <marcus.spiegel@gmail.com>
 * @author  Modified by Michael Matveev for Zoia
 * @link    https://github.com/jeresig/i18n-node
 * @license http://opensource.org/licenses/MIT
 *
 * @version 0.4.7
 */

// dependencies
const vsprintf = require('./sprintf.js').vsprintf;
const fs = require('fs');
const path = require('path');

function dotNotation(obj, is, value) {
    if (obj.hasOwnProperty(is)) {
        return obj[is];
    }
    if (typeof is === 'string') {
        return dotNotation(obj, is.split('.'), value);
    } else if (is.length === 1 && value !== undefined) {
        return obj[is[0]] = value;
    } else if (is.length === 0) {
        return obj;
    }
    if (obj.hasOwnProperty(is[0])) {
        return dotNotation(obj[is[0]], is.slice(1), value);
    }
    return obj[is.join('.')] = is.join('.');
}

let i18n = module.exports = function(opt) {
    const that = this;

    // Put into dev or production mode
    this.devMode = process.env.NODE_ENV !== 'production';

    // Copy over options
    for (let prop in opt) {
        this[prop] = opt[prop];
    }

    // you may register helpers in global scope, up to you
    if (typeof this.register === 'object') {
        i18n.resMethods.forEach(function(method) {
            that.register[method] = that[method].bind(that);
        });
    }

    // implicitly read all locales
    // if it's an array of locale names, read in the data
    if (opt.locales && opt.locales.forEach) {
        this.locales = {};

        opt.locales.forEach(function(locale) {
            that.readFile(locale);
        });

        this.defaultLocale = opt.locales[0];
    }

    // Set the locale to the default locale
    this.setLocale(this.defaultLocale);

    // Check the defaultLocale
    if (!this.locales[this.defaultLocale]) {
        console.error('Not a valid default locale.');
    }

    if (this.request) {
        if (this.subdomain) {
            this.setLocaleFromSubdomain(this.request);
        }

        if (this.query !== false) {
            this.setLocaleFromQuery(this.request);
        }

        if (this.session !== false) {
            this.setLocaleFromSessionVar(this.request);
        }

        this.prefLocale = this.preferredLocale();

        if (this.prefLocale !== false && this.prefLocale !== this.locale) {
            this.setLocale(this.prefLocale);
        }
    }
};

i18n.version = '0.4.7';

i18n.localeCache = {};
i18n.resMethods = ['__', '__n', 'getLocale', 'isPreferredLocale'];

i18n.registerMethods = function(helpers, req) {
    i18n.resMethods.forEach(function(method) {
        if (req) {
            helpers[method] = req.i18n[method].bind(req.i18n);
        } else {
            helpers[method] = function() {
                return req.i18n[method].bind(req.i18n);
            };
        }
    });
    return helpers;
};

i18n.prototype = {
    defaultLocale: 'en',
    extension: '.js',
    directory: './locales',
    cookieName: 'lang',
    sessionVarName: 'locale',
    indent: '\t',

    parse: JSON.parse,

    dump: function(data, indent) {
        return JSON.stringify(data, null, indent);
    },

    __: function(locale) {
        let msg = this.translate(locale || this.locale, arguments[1]);
        if (arguments.length > 2) {
            msg = vsprintf(msg, Array.prototype.slice.call(arguments, 2));
        }
        return msg;
    },

    setLocale: function(locale) {
        if (!locale) {
            return;
        }
        if (!this.locales[locale]) {
            if (this.devMode) {
                console.warn('Locale (' + locale + ') not found.');
            }
            locale = this.defaultLocale;
        }
        return (this.locale = locale);
    },

    getLocale: function() {
        return this.locale;
    },

    isPreferredLocale: function() {
        return !this.prefLocale ||
            this.prefLocale === this.getLocale();
    },

    setLocaleFromSessionVar: function(req) {
        req = req || this.request;
        if (!req || !req.session || !req.session[this.sessionVarName]) {
            return;
        }
        let locale = req.session[this.sessionVarName];
        if (this.locales[locale]) {
            this.setLocale(locale);
        }
    },

    setLocaleFromQuery: function(req) {
        req = req || this.request;
        if (!req || !req.query || !req.query.lang) {
            return;
        }
        let locale = (req.query.lang + '').toLowerCase();
        if (this.locales[locale]) {
            this.setLocale(locale);
        }
    },

    setLocaleFromSubdomain: function(req) {
        req = req || this.request;
        if (!req || !req.headers || !req.headers.host) {
            return;
        }
        if (/^([^.]+)/.test(req.headers.host) && this.locales[RegExp.$1]) {
            this.setLocale(RegExp.$1);
        }
    },

    setLocaleFromCookie: function(req) {
        req = req || this.request;
        if (!req || !req.cookies || !this.cookieName || !req.cookies[this.cookieName]) {
            return;
        }
        let locale = req.cookies[this.cookieName].toLowerCase();
        if (this.locales[locale]) {
            this.setLocale(locale);
        }
    },

    setLocaleFromEnvironmentVariable: function() {
        if (!process.env.LANG) {
            return;
        }
        let locale = process.env.LANG.split('_')[0];
        if (this.locales[locale]) {
            this.setLocale(locale);
        }
    },

    preferredLocale: function(req) {
        req = req || this.request;
        if (!req || !req.headers) {
            return;
        }
        let accept = req.headers['accept-language'] || '';
        const regExp = /(^|,\s*)([a-z0-9-]+)/gi;
        const that = this;
        let prefLocale;
        let match;
        while (!prefLocale && (match = regExp.exec(accept))) {
            let locale = match[2].toLowerCase();
            let parts = locale.split('-');
            if (that.locales[locale]) {
                prefLocale = locale;
            } else if (parts.length > 1 && that.locales[parts[0]]) {
                prefLocale = parts[0];
            }
        }
        return prefLocale || this.defaultLocale;
    },

    // read locale file, translate a msg and write to fs if new
    translate: function(locale, singular, plural) {
        if (!locale || !this.locales[locale]) {
            if (this.devMode) {
                console.warn('WARN: No locale found. Using the default (' +
                    this.defaultLocale + ') as current locale');
            }

            locale = this.defaultLocale;

            this.initLocale(locale, {});
        }
        if (!this.locales[locale][singular]) {
            if (this.devMode) {
                dotNotation(this.locales[locale], singular, plural ? { one: singular, other: plural } : undefined);
                this.writeFile(locale);
            }
        }
        return dotNotation(this.locales[locale], singular, plural ? { one: singular, other: plural } : undefined);
    },

    // try reading a file
    readFile: function(locale) {
        let file = this.locateFile(locale);
        if (!this.devMode && i18n.localeCache[file]) {
            this.initLocale(locale, i18n.localeCache[file]);
            return;
        }
        try {
            let localeFile = fs.readFileSync(file);
            let base;
            if (typeof this.base === 'function') {
                let baseFilename;
                try {
                    baseFilename = this.base(locale);
                } catch (e) {
                    console.error('base function threw exception for locale %s', locale, e);
                }
                if (typeof baseFilename === 'string') {
                    try {
                        base = this.parse(fs.readFileSync(this.locateFile(baseFilename)));
                    } catch (e) {
                        console.error('unable to read or parse base file %s for locale %s', baseFilename, locale, e);
                    }
                }
            }
            try {
                let content = this.parse(localeFile);
                if (base) {
                    for (let prop in content) {
                        base[prop] = content[prop];
                    }
                    content = base;
                }
                this.initLocale(locale, content);
            } catch (e) {
                console.error('unable to parse locales from file (maybe ' + file +
                    ' is empty or invalid ' + this.extension + '?): ', e);
            }
        } catch (e) {
            if (!fs.existsSync(file)) {
                this.writeFile(locale);
            }
        }
    },

    // try writing a file in a created directory
    writeFile: function(locale) {
        // don't write new locale information to disk if we're not in dev mode
        if (!this.devMode) {
            // Initialize the locale if didn't exist already
            this.initLocale(locale, {});
            return;
        }
        try {
            fs.lstatSync(this.directory);
        } catch (e) {
            fs.mkdirSync(this.directory, 755);
        }
        this.initLocale(locale, {});
        let target;
        let tmp;
        try {
            target = this.locateFile(locale);
            tmp = target + '.tmp';
            fs.writeFileSync(tmp,
                this.dump(this.locales[locale], this.indent),
                'utf8');
            if (fs.statSync(tmp).isFile()) {
                fs.renameSync(tmp, target);
            } else {
                console.error('unable to write locales to file (either ' + tmp +
                    ' or ' + target + ' are not writeable?): ');
            }
        } catch (e) {
            console.error('unexpected error writing files (either ' + tmp +
                ' or ' + target + ' are not writeable?): ', e);
        }
    },

    // basic normalization of filepath
    locateFile: function(locale) {
        return path.normalize(this.directory + '/' + locale + this.extension);
    },

    initLocale: function(locale, data) {
        if (!this.locales[locale]) {
            this.locales[locale] = data;
            if (!this.devMode) {
                let file = this.locateFile(locale);
                if (!i18n.localeCache[file]) {
                    i18n.localeCache[file] = data;
                }
            }
        }
    }
};