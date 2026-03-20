const { ApiError } = require("../../utils/api-error");
const appointmentRepository = require("./appointment.repository");

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function dateToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function hhmmToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapAppointment(appointment) {
  return {
    id: appointment.id,
    clientId: appointment.clientId,
    barberId: appointment.barberId,
    serviceId: appointment.serviceId,
    startDatetime: toIso(appointment.startsAt),
    endDatetime: toIso(appointment.endsAt),
    status: appointment.status,
    notes: appointment.notes,
    cancelReason: appointment.cancelReason,
    cancelledAt: appointment.cancelledAt,
    completedAt: appointment.completedAt,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    client: appointment.client
      ? {
          id: appointment.client.id,
          name: appointment.client.fullName,
          phone: appointment.client.phone,
        }
      : null,
    barber: appointment.barber
      ? {
          id: appointment.barber.id,
          name: appointment.barber.fullName,
        }
      : null,
    service: appointment.service
      ? {
          id: appointment.service.id,
          name: appointment.service.name,
          durationMinutes: appointment.service.durationMin,
        }
      : null,
  };
}

async function ensureReferencesAndBuildRange({ clientId, barberId, serviceId, startDatetime, excludeAppointmentId }) {
  const [client, barber, service] = await Promise.all([
    appointmentRepository.findClientById(clientId),
    appointmentRepository.findBarberById(barberId),
    appointmentRepository.findServiceById(serviceId),
  ]);

  if (!client) {
    throw new ApiError("Client not found", 404);
  }
  if (!barber) {
    throw new ApiError("Barber not found", 404);
  }
  if (!service) {
    throw new ApiError("Service not found", 404);
  }
  if (!barber.isActive) {
    throw new ApiError("Barber is inactive", 400);
  }
  if (!service.isActive) {
    throw new ApiError("Service is inactive", 400);
  }

  const startDate = new Date(startDatetime);
  if (Number.isNaN(startDate.getTime())) {
    throw new ApiError("Invalid startDatetime", 400);
  }

  const endDate = addMinutes(startDate, service.durationMin);

  const schedules = await appointmentRepository.findSchedulesByBarberAndDay({
    barberId,
    dayOfWeek: startDate.getDay(),
  });
  if (!schedules.length) {
    throw new ApiError("Appointment is outside barber working hours", 400);
  }

  const startMinutes = dateToMinutes(startDate);
  const endMinutes = dateToMinutes(endDate);
  const insideWorkingBlock = schedules.some((row) => {
    const scheduleStart = hhmmToMinutes(row.startTime);
    const scheduleEnd = hhmmToMinutes(row.endTime);
    return startMinutes >= scheduleStart && endMinutes <= scheduleEnd;
  });
  if (!insideWorkingBlock) {
    throw new ApiError("Appointment is outside barber working hours", 400);
  }

  const blocked = await appointmentRepository.findBlockedTimeOverlap({
    barberId,
    startDate,
    endDate,
  });
  if (blocked) {
    throw new ApiError("Appointment is inside blocked time", 409);
  }

  // Overlap rule: newStart < existingEnd AND newEnd > existingStart
  const overlapping = await appointmentRepository.findOverlappingAppointment({
    barberId,
    startDate,
    endDate,
    excludeAppointmentId,
  });
  if (overlapping) {
    throw new ApiError("Barber already has an overlapping appointment", 409);
  }

  return { startDate, endDate };
}

async function list(query) {
  const filters = {};
  if (query.barberId !== undefined) filters.barberId = query.barberId;
  if (query.clientId !== undefined) filters.clientId = query.clientId;
  if (query.status !== undefined) filters.status = query.status;
  if (query.from || query.to) {
    filters.startsAt = {};
    if (query.from) filters.startsAt.gte = new Date(query.from);
    if (query.to) filters.startsAt.lte = new Date(query.to);
  }

  const rows = await appointmentRepository.findMany(filters);
  return rows.map(mapAppointment);
}

async function getById(id) {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) {
    throw new ApiError("Appointment not found", 404);
  }

  return mapAppointment(appointment);
}

async function create(payload, authUser) {
  const { startDate, endDate } = await ensureReferencesAndBuildRange({
    clientId: payload.clientId,
    barberId: payload.barberId,
    serviceId: payload.serviceId,
    startDatetime: payload.startDatetime,
  });

  const created = await appointmentRepository.create({
    clientId: payload.clientId,
    barberId: payload.barberId,
    serviceId: payload.serviceId,
    createdById: authUser.id,
    startsAt: startDate,
    endsAt: endDate,
    status: "PENDING",
    notes: payload.notes || null,
  });

  return mapAppointment(created);
}

async function update(id, payload) {
  const current = await appointmentRepository.findById(id);
  if (!current) {
    throw new ApiError("Appointment not found", 404);
  }
  if (current.status === "CANCELLED") {
    throw new ApiError("Cancelled appointments cannot be edited", 400);
  }

  const { startDate, endDate } = await ensureReferencesAndBuildRange({
    clientId: payload.clientId,
    barberId: payload.barberId,
    serviceId: payload.serviceId,
    startDatetime: payload.startDatetime,
    excludeAppointmentId: id,
  });

  const updated = await appointmentRepository.updateById(id, {
    clientId: payload.clientId,
    barberId: payload.barberId,
    serviceId: payload.serviceId,
    startsAt: startDate,
    endsAt: endDate,
    notes: payload.notes || null,
  });

  return mapAppointment(updated);
}

async function cancel(id, reason) {
  const current = await appointmentRepository.findById(id);
  if (!current) {
    throw new ApiError("Appointment not found", 404);
  }
  if (current.status === "CANCELLED") {
    throw new ApiError("Appointment is already cancelled", 400);
  }
  if (current.status === "COMPLETED") {
    throw new ApiError("Completed appointments cannot be cancelled", 400);
  }

  const updated = await appointmentRepository.updateById(id, {
    status: "CANCELLED",
    cancelReason: reason || null,
    cancelledAt: new Date(),
  });

  return mapAppointment(updated);
}

async function complete(id) {
  const current = await appointmentRepository.findById(id);
  if (!current) {
    throw new ApiError("Appointment not found", 404);
  }
  if (current.status === "CANCELLED") {
    throw new ApiError("Cancelled appointments cannot be completed", 400);
  }
  if (current.status === "COMPLETED") {
    throw new ApiError("Appointment is already completed", 400);
  }

  const updated = await appointmentRepository.updateById(id, {
    status: "COMPLETED",
    completedAt: new Date(),
  });

  return mapAppointment(updated);
}

async function getAvailability({ barberId, date }) {
  const barber = await appointmentRepository.findBarberById(barberId);
  if (!barber) {
    throw new ApiError("Barber not found", 404);
  }
  if (!barber.isActive) {
    throw new ApiError("Barber is inactive", 400);
  }

  const baseDate = new Date(date);
  if (Number.isNaN(baseDate.getTime())) {
    throw new ApiError("Invalid date", 400);
  }

  const dayStart = new Date(baseDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [schedules, blockedTimes, appointments] = await Promise.all([
    appointmentRepository.findSchedulesByBarberAndDay({
      barberId,
      dayOfWeek: dayStart.getDay(),
    }),
    appointmentRepository.findDayBlockedTimes({ barberId, dayStart, dayEnd }),
    appointmentRepository.findDayAppointments({ barberId, dayStart, dayEnd }),
  ]);

  return {
    barberId,
    date: dayStart.toISOString().slice(0, 10),
    schedules: schedules.map((row) => ({
      id: row.id,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
    })),
    blockedTimes: blockedTimes.map((row) => ({
      id: row.id,
      startDatetime: toIso(row.startsAt),
      endDatetime: toIso(row.endsAt),
      reason: row.reason,
    })),
    appointments: appointments.map((row) => ({
      id: row.id,
      startDatetime: toIso(row.startsAt),
      endDatetime: toIso(row.endsAt),
      status: row.status,
      clientId: row.clientId,
      serviceId: row.serviceId,
    })),
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  cancel,
  complete,
  getAvailability,
};
