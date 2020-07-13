export default {
    sendSuccessHTML: (rep, data = '') => rep.code(200).type('text/html').send(data),
    sendSuccessJSON: (rep, data = {}) => rep.code(200).type('application/json').send({
        statusCode: 200,
        ...data
    }),
    sendRedirect: (rep, url) => rep.code(302).redirect(url),
    sendClearCookieRedirect: (rep, cookie, cookieOptions, url) => rep.clearCookie(cookie, cookieOptions).code(302).redirect(url),
    sendError: (rep, httpStatus, statusCode, errorCode, message = 'Unknown error', errors) => rep.code(httpStatus).type('application/json')
        .send({
            statusCode,
            errorCode,
            message,
            errors
        }),
    sendBadRequestException: (rep, message = 'Unknown error', errors = {}) => rep.code(400).type('application/json')
        .send({
            statusCode: 400,
            message,
            errors
        }),
    sendBadRequestError: (rep, message = 'Unknown error', errors = {}, errorCode) => rep.code(200).type('application/json')
        .send({
            statusCode: 400,
            errorCode,
            message,
            errors
        }),
    sendUnauthorizedError: (rep, errors = {}) => rep.code(200).type('application/json')
        .send({
            statusCode: 401,
            message: 'Unauthorized',
            errors
        }),
    sendUnauthorizedException: (rep, errors = {}) => rep.code(401).type('application/json')
        .send({
            statusCode: 401,
            message: 'Unauthorized',
            errors
        }),
    sendInternalServerError: (rep, error) => rep.code(500).type('application/json')
        .send({
            statusCode: 500,
            message: 'Internal Server Error',
            error
        }),
    sendNotFoundError: (rep, message = 'Unknown error', errors = {}, errorCode) => rep.code(200).type('application/json')
        .send({
            statusCode: 404,
            errorCode,
            message,
            errors
        }),
};
