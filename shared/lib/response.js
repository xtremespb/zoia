export default {
    successJSON: (rep, data = {}) => rep.code(200).type("application/json").send({
        internalStatusCode: 200,
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
    unauthorizedError: rep => rep.code(401).type("application/json")
        .send({
            errorMessage: "Unauthorized",
        }),
};
