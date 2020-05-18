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
};
