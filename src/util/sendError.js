const defaultError = {
    message: 'Error',
    status: 500,
};

const sendError = (res, {status=defaultError.status, message=defaultError.message, errmsg, errorObj, developerMessage}) => {
    res.status(status).send({
        ...defaultError,
        status,
        message: errmsg || message,
        developerMessage,
    });
};

module.exports = { sendError };