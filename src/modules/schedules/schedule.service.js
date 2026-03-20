const { ApiError } = require("../../utils/api-error");
const scheduleRepository = require("./schedule.repository");

function toResponse(schedule) {
  return {
    id: schedule.id,
    barberId: schedule.barberId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    isWorkingDay: schedule.isWorkingDay,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}

async function ensureBarberExists(barberId) {
  const barber = await scheduleRepository.findBarberById(barberId);
  if (!barber) {
    throw new ApiError("Barber not found", 404);
  }
}

async function list(query) {
  const filters = {};
  if (query.barberId !== undefined) filters.barberId = query.barberId;
  if (query.dayOfWeek !== undefined) filters.dayOfWeek = query.dayOfWeek;

  const rows = await scheduleRepository.findMany(filters);
  return rows.map(toResponse);
}

async function getById(id) {
  const row = await scheduleRepository.findById(id);
  if (!row) {
    throw new ApiError("Schedule not found", 404);
  }
  return toResponse(row);
}

async function create(payload) {
  await ensureBarberExists(payload.barberId);

  const created = await scheduleRepository.create({
    barberId: payload.barberId,
    dayOfWeek: payload.dayOfWeek,
    startTime: payload.startTime,
    endTime: payload.endTime,
    isWorkingDay: payload.isWorkingDay ?? true,
  });
  return toResponse(created);
}

async function update(id, payload) {
  const current = await scheduleRepository.findById(id);
  if (!current) {
    throw new ApiError("Schedule not found", 404);
  }
  await ensureBarberExists(payload.barberId);

  const updated = await scheduleRepository.updateById(id, {
    barberId: payload.barberId,
    dayOfWeek: payload.dayOfWeek,
    startTime: payload.startTime,
    endTime: payload.endTime,
    isWorkingDay: payload.isWorkingDay ?? current.isWorkingDay,
  });
  return toResponse(updated);
}

async function updateStatus(id, isWorkingDay) {
  const current = await scheduleRepository.findById(id);
  if (!current) {
    throw new ApiError("Schedule not found", 404);
  }

  const updated = await scheduleRepository.updateById(id, { isWorkingDay });
  return toResponse(updated);
}

async function remove(id) {
  const current = await scheduleRepository.findById(id);
  if (!current) {
    throw new ApiError("Schedule not found", 404);
  }

  await scheduleRepository.deleteById(id);
  return { deleted: true };
}

module.exports = {
  list,
  getById,
  create,
  update,
  updateStatus,
  remove,
};
