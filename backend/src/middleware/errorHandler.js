const env = require("../config/env");
const APIError = require("../utils/ApiError");

function notFound(req, res, next) {
    next(APIError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(err, req, res, next) {
    let status = err.statusCode || err.status || 500;
    let message = err.message || "Internal Server Error";
    let details = err.details || null;

    // Log the error for debugging
    console.error(err);

    if(err.code === "23505") { // Unique violation error code in PostgreSQL
        status = 409;
        message = "The Value Is Already In Use";
        details = err.detail || null;
    }else if(err.code === "23503") { // Invalid text representation error code in PostgreSQL
        status = 400;
        message = "Bad Request: Invalid input";
        details = err.detail || null;
    }else if(err.code === "22P02") { // Invalid text representation error code in PostgreSQL
        status = 400;
        message = "Bad Request: Invalid input";
        details = err.detail || null;
    }else if(err.code === "ZodError") { // Zod validation error
        status = 400;
        message = "Bad Request: Invalid input";
        details = err.issues || null;
    }

    if (status >= 500) {
        console.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);
    }
    res.status(status).json({
        error: {
            message,
            ...(details ? {details} : {}),
        ...(env.isProd ? {} : {stack: err.stack}),
    },
});
}

module.exports = {
    notFound,
    errorHandler,
};