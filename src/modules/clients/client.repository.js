const prisma = require("../../config/prisma");

function findMany({ search } = {}) {
  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  return prisma.client.findMany({
    where,
    orderBy: { id: "desc" },
  });
}

function findById(id) {
  return prisma.client.findUnique({
    where: { id },
  });
}

function findByEmail(email) {
  return prisma.client.findFirst({
    where: { email },
  });
}

function create(data) {
  return prisma.client.create({
    data,
  });
}

function updateById(id, data) {
  return prisma.client.update({
    where: { id },
    data,
  });
}

module.exports = {
  findMany,
  findById,
  findByEmail,
  create,
  updateById,
};
