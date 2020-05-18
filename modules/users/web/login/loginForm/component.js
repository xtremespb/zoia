const {
    v4: uuidv4
} = require("uuid");
const Cookies = require("../../../../../shared/lib/cookies").default;
const Query = require("../../../../../shared/lib/query").default;

module.exports = class {
    onCreate(input, out) {
        this.cookieOptions = out.global.cookieOptions;
        this.siteOptions = out.global.siteOptions;
    }

    onMount() {
        this.cookies = new Cookies(this.cookieOptions);
        this.query = new Query();
    }

    onFormPostSuccess(response) {
        const {
            token
        } = response.data;
        this.cookies.set(`${this.siteOptions.globalPrefix || "zoia3"}.authToken`, token);
        this.getComponent("userLoginForm").func.setProgress(true);
        window.location.href = `${this.query.get("redirect") || "/"}?_=${uuidv4()}`;
    }
};
