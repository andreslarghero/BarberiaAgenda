const dotenv = require("dotenv");

dotenv.config();

function parseBoolean(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return String(value).toLowerCase() === "true";
}

function parsePositiveInt(value, defaultValue) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return Math.floor(parsed);
}

const env = {
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  /** Orígenes permitidos para CORS (coma-separados). Ej: https://app.vercel.app,http://localhost:5173 */
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  REMINDERS_ENABLED: parseBoolean(process.env.REMINDERS_ENABLED, false),
  REMINDERS_INTERVAL_MINUTES: parsePositiveInt(process.env.REMINDERS_INTERVAL_MINUTES, 5),
};

module.exports = { env };
