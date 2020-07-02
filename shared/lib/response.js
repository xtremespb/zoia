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
        let url = site.i18n.getLocalizedURL(`/?_=${new Date().getTime()}`);
        const redirect = req.query.redirect && typeof req.query.redirect === "string" ? req.query.redirect.trim() : "";
        if (redirect.length > 1 && redirect.charAt(0) === "/") {
            url = redirect.replace(/([^:]\/)\/+/g, "$1");
            url = `${url}?_=${new Date().getTime()}`;
        }
        return rep.code(302).redirect(url);
    },
    redirectToRoot: (req, rep, site) => {
        const url = site.i18n.getLocalizedURL(`/?_=${new Date().getTime()}`);
        rep.code(302).redirect(url);
    },
    redirectToLogin: (req, rep, site, url) => {
        const newURL = `${site.i18n.getLocalizedURL(`${req.zoiaConfig.routes.login}?redirect=`)}${site.i18n.getLocalizedURL(url)}`;
        rep.code(302).redirect(newURL);
    },
    sendHTML: (rep, data) => rep.code(200).type("text/html").send(data),
    sendError: (rep, msg, code) => {
        const error = new Error(msg);
        error.code = code;
        rep.send(error);
    },
    getCode204: rep => rep.code(204)
};
