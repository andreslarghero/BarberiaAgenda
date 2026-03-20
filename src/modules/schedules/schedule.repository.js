const prisma = require("../../config/prisma");

function findMany(filters = {}) {
  return prisma.barberSchedule.findMany({
    where: filters,
    orderBy: [{ barberId: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

function findById(id) {
  return prisma.barberSchedule.findUnique({
    where: { id },
  });
}

function create(data) {
  return prisma.barberSchedule.create({
    data,
  });
}

function updateById(id, data) {
  return prisma.barberSchedule.update({
    where: { id },
    data,
  });
}

function deleteById(id) {
  return prisma.barberSchedule.delete({
    where: { id },
  });
}

function findBarberById(id) {
  return prisma.barber.findUnique({
    where: { id },
  });
}

module.exports = {
  findMany,
  findById,
  create,
  updateById,
  deleteById,
  findBarberById,
};
