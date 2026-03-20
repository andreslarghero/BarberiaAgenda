const { ApiError } = require("../../utils/api-error");
const blockedTimeRepository = require("./blocked-time.repository");

function toResponse(row) {
  return {
    id: row.id,
    barberId: row.barberId,
    startDatetime: row.startsAt,
    endDatetime: row.endsAt,
    reason: row.reason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function ensureBarberExists(barberId) {
  const barber = await blockedTimeRepository.findBarberById(barberId);
  if (!barber) {
    throw new ApiError("Barber not found", 404);
  }
}

async function ensureNoOverlap({ barberId, startDate, endDate, excludeBlockedTimeId }) {
  const overlapping = await blockedTimeRepository.findOverlapping({
    barberId,
    startDate,
    endDate,
    excludeBlockedTimeId,
  });
  if (overlapping) {
    throw new ApiError("Blocked time overlaps another blocked time", 409);
  }
}

async function list(query) {
  const filters = {};
  if (query.barberId !== undefined) filters.barberId = query.barberId;
  if (query.from || query.to) {
    filters.startsAt = {};
    if (query.from) filters.startsAt.gte = new Date(query.from);
    if (query.to) filters.startsAt.lte = new Date(query.to);
  }

  const rows = await blockedTimeRepository.findMany(filters);
  return rows.map(toResponse);
}

async function getById(id) {
  const row = await blockedTimeRepository.findById(id);
  if (!row) {
    throw new ApiError("Blocked time not found", 404);
  }
  return toResponse(row);
}

async function create(payload) {
  await ensureBarberExists(payload.barberId);
  const startDate = new Date(payload.startDatetime);
  const endDate = new Date(payload.endDatetime);

  await ensureNoOverlap({
    barberId: payload.barberId,
    startDate,
    endDate,
  });

  const created = await blockedTimeRepository.create({
    barberId: payload.barberId,
    startsAt: startDate,
    endsAt: endDate,
    reason: payload.reason || null,
  });
  return toResponse(created);
}

async function update(id, payload) {
  const current = await blockedTimeRepository.findById(id);
  if (!current) {
    throw new ApiError("Blocked time not found", 404);
  }
  await ensureBarberExists(payload.barberId);

  const startDate = new Date(payload.startDatetime);
  const endDate = new Date(payload.endDatetime);

  await ensureNoOverlap({
    barberId: payload.barberId,
    startDate,
    endDate,
    excludeBlockedTimeId: id,
  });

  const updated = await blockedTimeRepository.updateById(id, {
    barberId: payload.barberId,
    startsAt: startDate,
    endsAt: endDate,
    reason: payload.reason || null,
  });
  return toResponse(updated);
}

async function remove(id) {
  const current = await blockedTimeRepository.findById(id);
  if (!current) {
    throw new ApiError("Blocked time not found", 404);
  }

  await blockedTimeRepository.deleteById(id);
  return { deleted: true };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
