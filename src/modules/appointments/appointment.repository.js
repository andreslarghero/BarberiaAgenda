const prisma = require("../../config/prisma");

function findMany(filters = {}) {
  return prisma.appointment.findMany({
    where: filters,
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      barber: { select: { id: true, fullName: true } },
      service: { select: { id: true, name: true, durationMin: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}

function findById(id) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      barber: { select: { id: true, fullName: true } },
      service: { select: { id: true, name: true, durationMin: true } },
    },
  });
}

function create(data) {
  return prisma.appointment.create({
    data,
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      barber: { select: { id: true, fullName: true } },
      service: { select: { id: true, name: true, durationMin: true } },
    },
  });
}

function updateById(id, data) {
  return prisma.appointment.update({
    where: { id },
    data,
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      barber: { select: { id: true, fullName: true } },
      service: { select: { id: true, name: true, durationMin: true } },
    },
  });
}

function findClientById(id) {
  return prisma.client.findUnique({ where: { id } });
}

function findBarberById(id) {
  return prisma.barber.findUnique({ where: { id } });
}

function findServiceById(id) {
  return prisma.service.findUnique({ where: { id } });
}

function findOverlappingAppointment({ barberId, startDate, endDate, excludeAppointmentId }) {
  const where = {
    barberId,
    status: { not: "CANCELLED" },
    startsAt: { lt: endDate },
    endsAt: { gt: startDate },
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  return prisma.appointment.findFirst({
    where,
    select: { id: true },
  });
}

function findSchedulesByBarberAndDay({ barberId, dayOfWeek }) {
  return prisma.barberSchedule.findMany({
    where: {
      barberId,
      dayOfWeek,
      isWorkingDay: true,
    },
    orderBy: { startTime: "asc" },
  });
}

function findBlockedTimeOverlap({ barberId, startDate, endDate }) {
  return prisma.blockedTime.findFirst({
    where: {
      barberId,
      startsAt: { lt: endDate },
      endsAt: { gt: startDate },
    },
    select: { id: true },
  });
}

function findDayAppointments({ barberId, dayStart, dayEnd }) {
  return prisma.appointment.findMany({
    where: {
      barberId,
      status: { not: "CANCELLED" },
      startsAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      clientId: true,
      serviceId: true,
    },
  });
}

function findDayBlockedTimes({ barberId, dayStart, dayEnd }) {
  return prisma.blockedTime.findMany({
    where: {
      barberId,
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      reason: true,
    },
  });
}

module.exports = {
  findMany,
  findById,
  create,
  updateById,
  findClientById,
  findBarberById,
  findServiceById,
  findOverlappingAppointment,
  findSchedulesByBarberAndDay,
  findBlockedTimeOverlap,
  findDayAppointments,
  findDayBlockedTimes,
};
