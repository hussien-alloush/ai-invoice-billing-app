const env = require('../config/env');
const { verifyToken } = require('../utils/jwt');
const APIError = require('../utils/ApiError');
const User = require('../models/user');

async function auth(req, res, next) {
    try {
        // Get JWT token from cookies
        const token = req.cookies?.[env.cookieName];

        // Check if token exists
        if (!token) {
            throw new APIError('Unauthorized', 401);
        }

        // Verify token
        const payload = await verifyToken(token);

        // Find user using the ID stored in the token
        const user = await User.findById(payload.sub);

        // Check if user still exists
        if (!user || (payload.sv ?? 0) !== user.session_version) {
            throw new APIError('Unauthorized', 401);
        }

        // Attach user to the request
        req.user = user;

        // Continue to the next middleware/controller
        return next();
    } catch (err) {
        // Handle invalid or expired JWT
        if (
            err.name === 'TokenExpiredError' ||
            err.name === 'JsonWebTokenError'
        ) {
            return next(new APIError('Unauthorized', 401));
        }

        // Pass other errors to the global error handler
        return next(err);
    }
}



module.exports = auth;