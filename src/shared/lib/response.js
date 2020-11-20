export default class {
    constructor(req, rep, site) {
        this.req = req;
        this.rep = rep;
        this.site = site;
    }

    setSite(site) {
        this.site = site;
    }

    successJSON(data = {}) {
        this.rep.code(200).type("application/json").send({
            ...data
        });
    }

    internalServerError(error, errorMessage = "Internal Server Error") {
        this.rep.code(500).type("application/json")
            .send({
                errorMessage,
                error
            });
    }

    validationError(error = {}) {
        this.rep.code(400).type("application/json")
            .send({
                errorMessage: "Request Validation Failed",
                error
            });
    }

    requestError(error = {}) {
        this.rep.code(400).type("application/json")
            .send({
                errorMessage: "Request Failed",
                error
            });
    }

    unauthorizedError(invalidUsernameOrPassword) {
        this.rep.code(401).type("application/json")
            .send({
                errorMessage: "Unauthorized",
                ...(invalidUsernameOrPassword ? {
                    error: {
                        failed: true,
                        error: "Invalid username or password",
                        errorKeyword: "invalidUsernameOrPassword",
                        errorData: [{
                            keyword: "invalidUsernameOrPassword",
                            dataPath: `.username`,
                        }, {
                            keyword: "invalidUsernameOrPassword",
                            dataPath: `.password`,
                        }]
                    }
                } : {})
            });
    }

    redirectToQuery() {
        let url = this.site.i18n.getLocalizedURL(`/?_=${new Date().getTime()}`);
        const redirect = this.req.query.redirect && typeof this.req.query.redirect === "string" ? this.req.query.redirect.trim() : "";
        if (redirect.length > 1 && redirect.charAt(0) === "/") {
            url = redirect.replace(/([^:]\/)\/+/g, "$1");
            url = `${url}?_=${new Date().getTime()}`;
        }
        return this.rep.code(302).redirect(url);
    }

    redirectToRoot() {
        const url = this.site.i18n.getLocalizedURL(`/?_=${new Date().getTime()}`);
        this.rep.code(302).redirect(url);
    }

    redirectToLogin(url) {
        const newURL = `${this.site.i18n.getLocalizedURL(`${this.req.zoiaConfig.routes.login}?redirect=`)}${this.site.i18n.getLocalizedURL(url)}`;
        this.rep.code(302).redirect(newURL);
    }

    sendHTML(data) {
        this.rep.code(200).type("text/html").send(data);
    }

    sendError(msg, code) {
        const error = new Error(msg);
        error.code = code;
        this.rep.send(error);
    }

    getCode204() {
        this.rep.code(204);
    }
}
