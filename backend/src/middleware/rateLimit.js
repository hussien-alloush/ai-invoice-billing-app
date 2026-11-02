const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const aiLimiter = rateLimit({
  windowMs:  60 * 1000, // 1 minute
  limit: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip || "127.0.0.1"),
  message:{
    error: {
      message: "Too many requests, please try again later.",
    },
  }
});

const authLimiter = rateLimit({
  windowMs:  60 * 1000, // 1 minute
  limit: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => ipKeyGenerator(req.ip || "127.0.0.1"),
    message:{
    error: {
        message: "Too many requests, please try again later.",
    },
  }
});
module.exports = {
  aiLimiter,
  authLimiter,
};