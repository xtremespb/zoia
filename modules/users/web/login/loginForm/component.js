const Cookies = require("../../../../../shared/lib/cookies").default;
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        const state = {
            unauthorized: true
        };
        this.state = state;
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
        this.i18n = out.global.i18n;
    }

    onMount() {
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
    }

    onFormPostSuccess(response) {
        const {
            token
        } = response.data;
        this.cookies.set(`${this.siteOptions.id || "zoia3"}.authToken`, token);
        this.getComponent("userLoginForm").func.setProgress(true);
        this.setState("unauthorized", false);
        window.location.href = `${this.query.get("redirect") || this.i18n.getLocalizedURL("/")}?_=${new Date().getTime()}`;
    }
};
