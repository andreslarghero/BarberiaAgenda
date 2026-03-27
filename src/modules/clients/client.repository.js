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

function findAppointmentHistoryByClientId(clientId) {
  return prisma.appointment.findMany({
    where: { clientId },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      startsAt: true,
      status: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      barber: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
}

module.exports = {
  findMany,
  findById,
  findByEmail,
  create,
  updateById,
  findAppointmentHistoryByClientId,
};
