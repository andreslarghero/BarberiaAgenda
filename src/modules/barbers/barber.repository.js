const prisma = require("../../config/prisma");

function findMany(filters = {}) {
  return prisma.barber.findMany({
    where: filters,
    orderBy: { id: "desc" },
  });
}

function findById(id) {
  return prisma.barber.findUnique({
    where: { id },
  });
}

function findByEmail(email) {
  return prisma.barber.findFirst({
    where: { email },
  });
}

function create(data) {
  return prisma.barber.create({
    data,
  });
}

function updateById(id, data) {
  return prisma.barber.update({
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
