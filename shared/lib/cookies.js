const cloneDeep = require("lodash.clonedeep");

export default class {
    constructor(optionsConfig = {}) {
        const defaults = {
            path: "/",
            domain: "",
            expires: new Date(new Date().getTime() + 604800000),
            secure: undefined,
            sameSite: undefined,
        };
        const options = cloneDeep(optionsConfig);
        this.options = {
            ...defaults
        };
        if (options && typeof options === "object") {
            options.expires = options.expires !== undefined && options.expires !== null ? new Date(new Date().getTime() + options.expires * 1000) : defaults.expires;
            Object.keys(options).map(o => this.options[o] = options[o]);
            options.expires = options.expires.toUTCString();
        }
    }

    set(name, value, optionsData) {
        if (!name) {
            return;
        }
        const options = optionsData || this.options;
        if (value instanceof Object) {
            value = JSON.stringify(value);
        }
        let updatedCookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        Object.keys(options).map(key => {
            if (options[key] !== undefined && options[key] !== null) {
                updatedCookie += `;${key}`;
                const optionValue = options[key];
                if (optionValue !== true) {
                    updatedCookie += `=${optionValue}`;
                }
            }
        });
        document.cookie = updatedCookie;
    }

    get(name, json = false) {
        if (!name || !process.browser) {
            return null;
        }
        const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`));
        if (matches) {
            const res = decodeURIComponent(matches[1]);
            if (json) {
                try {
                    return JSON.parse(res);
                } catch (e) {
                    // Ignore
                }
            }
            return res;
        }
        return null;
    }

    delete(name) {
        this.set(name, null, {
            expires: "Thu, 01 Jan 1970 00:00:01 GMT",
            path: "/"
        });
    }
}
