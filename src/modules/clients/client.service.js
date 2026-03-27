const { ApiError } = require("../../utils/api-error");
const clientRepository = require("./client.repository");

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function toResponse(client) {
  return {
    id: client.id,
    name: client.fullName,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

async function list(query, authUser) {
  if (authUser?.role === "CLIENT") {
    if (!authUser.clientId) {
      throw new ApiError("Client account is not linked", 403);
    }
    const own = await clientRepository.findById(authUser.clientId);
    return own ? [toResponse(own)] : [];
  }
  const rows = await clientRepository.findMany({ search: query.search });
  return rows.map(toResponse);
}

async function getById(id, authUser) {
  if (authUser?.role === "CLIENT") {
    if (!authUser.clientId || authUser.clientId !== id) {
      throw new ApiError("Forbidden", 403);
    }
  }
  const client = await clientRepository.findById(id);
  if (!client) {
    throw new ApiError("Client not found", 404);
  }
  return toResponse(client);
}

async function create(payload) {
  const email = payload.email || null;
  if (email) {
    const duplicated = await clientRepository.findByEmail(email);
    if (duplicated) {
      throw new ApiError("Client email already exists", 409);
    }
  }

  const created = await clientRepository.create({
    fullName: normalizeName(payload.name),
    phone: payload.phone,
    email,
    notes: payload.notes || null,
  });

  return toResponse(created);
}

async function update(id, payload) {
  const current = await clientRepository.findById(id);
  if (!current) {
    throw new ApiError("Client not found", 404);
  }

  const data = {};
  if (payload.name !== undefined) {
    data.fullName = normalizeName(payload.name);
  }
  if (payload.phone !== undefined) {
    data.phone = payload.phone;
  }
  if (payload.notes !== undefined) {
    data.notes = payload.notes || null;
  }
  if (payload.email !== undefined) {
    const email = payload.email || null;
    if (email && email !== current.email) {
      const duplicated = await clientRepository.findByEmail(email);
      if (duplicated) {
        throw new ApiError("Client email already exists", 409);
      }
    }
    data.email = email;
  }

  const updated = await clientRepository.updateById(id, data);
  return toResponse(updated);
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

async function getHistory(id, authUser) {
  if (authUser?.role === "CLIENT") {
    if (!authUser.clientId || authUser.clientId !== id) {
      throw new ApiError("Forbidden", 403);
    }
  }
  const client = await clientRepository.findById(id);
  if (!client) {
    throw new ApiError("Client not found", 404);
  }

  const appointments = await clientRepository.findAppointmentHistoryByClientId(id);
  const items = appointments.map((row) => ({
    id: row.id,
    date: toIso(row.startsAt),
    status: row.status,
    service: row.service
      ? {
          id: row.service.id,
          name: row.service.name,
        }
      : null,
    barber: row.barber
      ? {
          id: row.barber.id,
          name: row.barber.fullName,
        }
      : null,
  }));

  const completedCount = items.filter((item) => item.status === "COMPLETED").length;
  const latestVisit = items.length ? items[0].date : null;

  return {
    client: {
      id: client.id,
      name: client.fullName,
      phone: client.phone,
      email: client.email,
    },
    metrics: {
      totalAppointments: items.length,
      completedAppointments: completedCount,
      latestVisit,
    },
    appointments: items,
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  getHistory,
};
