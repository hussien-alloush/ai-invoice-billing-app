const dotenv = require("dotenv");
const path = require("path");


dotenv.config({ path: path.resolve(__dirname, "../../.env") });



const required = [ "DATABASE_URL", "JWT_SECRET" ];
const missing = required.filter((key) => !process.env[key]);
if (missing.length ) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}


const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  cookieName: process.env.COOKIE_NAME || "aibm_token",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "",
  frontendUrl: process.env.FRONTEND_URL || clientOrigins[0],
  clientOrigin: clientOrigins,
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  isProd: process.env.NODE_ENV === "production",
};
