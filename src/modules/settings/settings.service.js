const settingsRepository = require("./settings.repository");

const DEFAULT_SETTINGS = {
  businessName: "Agenda Barberia",
  currency: "ARS",
  defaultCommissionRate: 0.4,
};

function toResponse(settings) {
  if (!settings) {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    businessName: settings.businessName,
    currency: settings.currency,
    defaultCommissionRate: Number(settings.defaultCommissionRate),
  };
}

async function getSettings() {
  const settings = await settingsRepository.findGlobalSettings();
  return toResponse(settings);
}

async function updateSettings(payload) {
  const updated = await settingsRepository.upsertGlobalSettings({
    businessName: payload.businessName,
    currency: payload.currency,
    defaultCommissionRate: payload.defaultCommissionRate,
  });
  return toResponse(updated);
}

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
};
