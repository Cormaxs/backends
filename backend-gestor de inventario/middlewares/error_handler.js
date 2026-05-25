export function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;
    const response = {
        success: false,
        message: err.message || 'Error interno del servidor.'
    };

    if (process.env.NODE_ENV === 'development') {
        response.details = err.stack;
    }

    res.status(statusCode).json(response);
}
