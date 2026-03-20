let PrismaClient;

try {
  ({ PrismaClient } = require("@prisma/client"));
} catch (_error) {
  // Fallback for local Windows environments where @prisma/client linkage is broken.
  ({ PrismaClient } = require("../../node_modules/.prisma/client"));
}

const prisma = new PrismaClient();

module.exports = prisma;
