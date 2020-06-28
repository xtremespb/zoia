import {
    v4 as uuid
} from "uuid";

export default {
    successJSON: (rep, data = {}) => rep.code(200).type("application/json").send({
        ...data
    }),
    internalServerError: (rep, error, errorMessage = "Internal Server Error") => rep.code(500).type("application/json")
        .send({
            errorMessage,
            error
        }),
    validationError: (rep, error = {}) => rep.code(400).type("application/json")
        .send({
            errorMessage: "Request Validation Failed",
            error
        }),
    requestError: (rep, error = {}) => rep.code(400).type("application/json")
        .send({
            errorMessage: "Request Failed",
            error
        }),
    unauthorizedError: (rep, invalidUsernameOrPassword) => rep.code(401).type("application/json")
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
        }),
    redirectToQuery: (req, rep, site) => {
        let url = site.i18n.getLocalizedURL(`/?_=${uuid()}`);
        const redirect = req.query.redirect && typeof req.query.redirect === "string" ? req.query.redirect.trim() : "";
        if (redirect.length > 1 && redirect.charAt(0) === "/") {
            url = redirect.replace(/([^:]\/)\/+/g, "$1");
            url = `${url}?_=${uuid()}`;
        }
        if (req.zoiaConfig.devServer && req.zoiaConfig.devServer.active) {
            url = url.match(/^\//) ? url.replace(/^\//, "") : url;
        }
        return rep.code(302).redirect(url);
    },
    redirectToRoot: (req, rep, site) => rep.code(302).redirect(site.i18n.getLocalizedURL(`/?_=${uuid()}`).replace(/^\//, "")),
    redirectToLogin: (req, rep, site, url) => {
        let newURL = `${site.i18n.getLocalizedURL(`${req.zoiaConfig.routes.login}?redirect=`)}${site.i18n.getLocalizedURL(url)}`;
        if (req.zoiaConfig.devServer && req.zoiaConfig.devServer.active) {
            newURL = newURL.match(/^\//) ? newURL.replace(/^\//, "") : newURL;
        }
        rep.code(302).redirect(newURL);
    },
    sendHTML: (rep, data) => rep.code(200).type("text/html").send(data)
};
