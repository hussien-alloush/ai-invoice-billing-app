class ApiError extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; // Mark this error as operational (expected)
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message, details) {
        return new ApiError(message || "Bad Request", 400, details);
    }
    static unauthorized(message, details) {
        return new ApiError(message || "Unauthorized", 401, details);
    }
    static forbidden(message, details) {
        return new ApiError(message || "Forbidden", 403, details);
    }
    static notFound(message, details) {
        return new ApiError(message || "Not Found", 404, details);
    }
    static conflict(message, details) {
        return new ApiError(message || "Conflict", 409, details);
    }
    static tooManyRequests(message, details) {
        return new ApiError(message || "Too Many Requests", 429, details);
    }
    static internal(message, details) {
        return new ApiError(message || "Internal Server Error", 500, details);
    }
}

module.exports = ApiError;