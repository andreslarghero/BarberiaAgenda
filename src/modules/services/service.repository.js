const prisma = require("../../config/prisma");

function findMany(filters = {}) {
  return prisma.service.findMany({
    where: filters,
    orderBy: { id: "desc" },
  });
}

function findById(id) {
  return prisma.service.findUnique({
    where: { id },
  });
}

function findByName(name) {
  return prisma.service.findFirst({
    where: { name },
  });
}

function create(data) {
  return prisma.service.create({
    data,
  });
}

function updateById(id, data) {
  return prisma.service.update({
    where: { id },
    data,
  });
}

module.exports = {
  findMany,
  findById,
  findByName,
  create,
  updateById,
};
