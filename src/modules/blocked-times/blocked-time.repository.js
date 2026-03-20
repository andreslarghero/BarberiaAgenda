const prisma = require("../../config/prisma");

function findMany(filters = {}) {
  return prisma.blockedTime.findMany({
    where: filters,
    orderBy: { startsAt: "asc" },
  });
}

function findById(id) {
  return prisma.blockedTime.findUnique({
    where: { id },
  });
}

function create(data) {
  return prisma.blockedTime.create({
    data,
  });
}

function updateById(id, data) {
  return prisma.blockedTime.update({
    where: { id },
    data,
  });
}

function deleteById(id) {
  return prisma.blockedTime.delete({
    where: { id },
  });
}

function findBarberById(id) {
  return prisma.barber.findUnique({
    where: { id },
  });
}

function findOverlapping({ barberId, startDate, endDate, excludeBlockedTimeId }) {
  const where = {
    barberId,
    startsAt: { lt: endDate },
    endsAt: { gt: startDate },
  };
  if (excludeBlockedTimeId) {
    where.id = { not: excludeBlockedTimeId };
  }

  return prisma.blockedTime.findFirst({
    where,
    select: { id: true },
  });
}

module.exports = {
  findMany,
  findById,
  create,
  updateById,
  deleteById,
  findBarberById,
  findOverlapping,
};
