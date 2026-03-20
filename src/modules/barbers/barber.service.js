const { ApiError } = require("../../utils/api-error");
const barberRepository = require("./barber.repository");

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function toResponse(barber) {
  return {
    id: barber.id,
    name: barber.fullName,
    phone: barber.phone,
    email: barber.email,
    notes: barber.notes,
    isActive: barber.isActive,
    createdAt: barber.createdAt,
    updatedAt: barber.updatedAt,
  };
}

async function list(query) {
  const filters = {};
  if (typeof query.isActive === "boolean") {
    filters.isActive = query.isActive;
  }

  const rows = await barberRepository.findMany(filters);
  return rows.map(toResponse);
}

async function getById(id) {
  const barber = await barberRepository.findById(id);
  if (!barber) {
    throw new ApiError("Barber not found", 404);
  }
  return toResponse(barber);
}

async function create(payload) {
  const email = payload.email || null;
  if (email) {
    const duplicated = await barberRepository.findByEmail(email);
    if (duplicated) {
      throw new ApiError("Barber email already exists", 409);
    }
  }

  const created = await barberRepository.create({
    fullName: normalizeName(payload.name),
    phone: payload.phone || null,
    email,
    notes: payload.notes || null,
  });

  return toResponse(created);
}

async function update(id, payload) {
  const current = await barberRepository.findById(id);
  if (!current) {
    throw new ApiError("Barber not found", 404);
  }

  const data = {};
  if (payload.name !== undefined) {
    data.fullName = normalizeName(payload.name);
  }
  if (payload.phone !== undefined) {
    data.phone = payload.phone || null;
  }
  if (payload.notes !== undefined) {
    data.notes = payload.notes || null;
  }
  if (payload.email !== undefined) {
    const email = payload.email || null;
    if (email && email !== current.email) {
      const duplicated = await barberRepository.findByEmail(email);
      if (duplicated) {
        throw new ApiError("Barber email already exists", 409);
      }
    }
    data.email = email;
  }

  const updated = await barberRepository.updateById(id, data);
  return toResponse(updated);
}

async function updateStatus(id, isActive) {
  const current = await barberRepository.findById(id);
  if (!current) {
    throw new ApiError("Barber not found", 404);
  }

  const updated = await barberRepository.updateById(id, { isActive });
  return toResponse(updated);
}

module.exports = {
  list,
  getById,
  create,
  update,
  updateStatus,
};
