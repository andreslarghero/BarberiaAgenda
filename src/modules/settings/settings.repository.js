const prisma = require("../../config/prisma");

const SETTINGS_ID = 1;

function findGlobalSettings() {
  return prisma.businessSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
}

function upsertGlobalSettings(data) {
  return prisma.businessSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      ...data,
    },
    update: data,
  });
}

module.exports = {
  SETTINGS_ID,
  findGlobalSettings,
  upsertGlobalSettings,
};
