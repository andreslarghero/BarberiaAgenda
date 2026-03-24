const dotenv = require("dotenv");

dotenv.config();

const env = {
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  /** Orígenes permitidos para CORS (coma-separados). Ej: https://app.vercel.app,http://localhost:5173 */
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

module.exports = { env };
