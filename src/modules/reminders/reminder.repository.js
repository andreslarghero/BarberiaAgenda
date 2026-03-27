const prisma = require("../../config/prisma");

function findUpcomingWithinRange({ fromDate, toDate }) {
  return prisma.appointment.findMany({
    where: {
      startsAt: {
        gte: fromDate,
        lte: toDate,
      },
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      id: true,
      startsAt: true,
      reminder24hSent: true,
      reminder2hSent: true,
      client: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      barber: {
        select: {
          id: true,
          fullName: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}

function markReminder24hSent(appointmentId) {
  return prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      reminder24hSent: false,
    },
    data: {
      reminder24hSent: true,
    },
  });
}

function markReminder2hSent(appointmentId) {
  return prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      reminder2hSent: false,
    },
    data: {
      reminder2hSent: true,
    },
  });
}

module.exports = {
  findUpcomingWithinRange,
  markReminder24hSent,
  markReminder2hSent,
};
