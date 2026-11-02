const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

module.exports = {
  generateToken,
  verifyToken,
  cookieOptions,
};