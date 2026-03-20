const { ApiError } = require("../../utils/api-error");
const serviceRepository = require("./service.repository");

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function toResponse(service) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMin,
    price: Number(service.price),
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

async function list(query) {
  const filters = {};
  if (typeof query.isActive === "boolean") {
    filters.isActive = query.isActive;
  }

  const rows = await serviceRepository.findMany(filters);
  return rows.map(toResponse);
}

async function getById(id) {
  const service = await serviceRepository.findById(id);
  if (!service) {
    throw new ApiError("Service not found", 404);
  }
  return toResponse(service);
}

async function create(payload) {
  const normalizedName = normalizeName(payload.name);
  const duplicated = await serviceRepository.findByName(normalizedName);
  if (duplicated) {
    throw new ApiError("Service name already exists", 409);
  }

  const created = await serviceRepository.create({
    name: normalizedName,
    description: payload.description || null,
    durationMin: payload.durationMinutes,
    price: payload.price,
  });

  return toResponse(created);
}

async function update(id, payload) {
  const current = await serviceRepository.findById(id);
  if (!current) {
    throw new ApiError("Service not found", 404);
  }

  const data = {};
  if (payload.name !== undefined) {
    const normalizedName = normalizeName(payload.name);
    if (normalizedName !== current.name) {
      const duplicated = await serviceRepository.findByName(normalizedName);
      if (duplicated) {
        throw new ApiError("Service name already exists", 409);
      }
    }
    data.name = normalizedName;
  }
  if (payload.description !== undefined) {
    data.description = payload.description || null;
  }
  if (payload.durationMinutes !== undefined) {
    data.durationMin = payload.durationMinutes;
  }
  if (payload.price !== undefined) {
    data.price = payload.price;
  }

  const updated = await serviceRepository.updateById(id, data);
  return toResponse(updated);
}

async function updateStatus(id, isActive) {
  const current = await serviceRepository.findById(id);
  if (!current) {
    throw new ApiError("Service not found", 404);
  }

  const updated = await serviceRepository.updateById(id, { isActive });
  return toResponse(updated);
}

module.exports = {
  list,
  getById,
  create,
  update,
  updateStatus,
};
