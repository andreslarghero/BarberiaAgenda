const prisma = require("../../config/prisma");

function findMany() {
  return prisma.user.findMany({
    orderBy: { id: "asc" },
    include: {
      barber: { select: { id: true, fullName: true } },
      client: { select: { id: true, fullName: true } },
    },
  });
}

function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      barber: { select: { id: true, fullName: true } },
      client: { select: { id: true, fullName: true } },
    },
  });
}

function create(data) {
  return prisma.user.create({
    data,
    include: {
      barber: { select: { id: true, fullName: true } },
      client: { select: { id: true, fullName: true } },
    },
  });
}

function updateById(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    include: {
      barber: { select: { id: true, fullName: true } },
      client: { select: { id: true, fullName: true } },
    },
  });
}

function deleteById(id) {
  return prisma.user.delete({
    where: { id },
  });
}

function findBarberById(id) {
  return prisma.barber.findUnique({ where: { id } });
}

function countActiveAdmins() {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
    },
  });
}

module.exports = {
  findMany,
  findByEmail,
  findById,
  create,
  updateById,
  deleteById,
  findBarberById,
  countActiveAdmins,
};
