const prisma = require("../../config/prisma");

function findCompletedAppointmentsInRange({ fromDate, toDate }) {
  return prisma.appointment.findMany({
    where: {
      status: "COMPLETED",
      startsAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      id: true,
      service: {
        select: {
          id: true,
          name: true,
          price: true,
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
  findCompletedAppointmentsInRange,
};
