const { ApiError } = require("../../utils/api-error");
const bcrypt = require("bcrypt");
const userRepository = require("./user.repository");
const LAST_ADMIN_BLOCK_MESSAGE = "Debe existir al menos un ADMIN activo";

function toResponse(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    barberId: user.barberId,
    clientId: user.clientId,
    barber: user.barber
      ? {
          id: user.barber.id,
          name: user.barber.fullName,
        }
      : null,
    client: user.client
      ? {
          id: user.client.id,
          name: user.client.fullName,
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function listUsers() {
  const rows = await userRepository.findMany();
  return rows.map(toResponse);
}

async function createUser(payload) {
  const existing = await userRepository.findByEmail(payload.email);
  if (existing) {
    throw new ApiError("User email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const created = await userRepository.create({
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    passwordHash,
    role: payload.role || "CLIENT",
    barberId: null,
    clientId: null,
    isActive: true,
  });
  return toResponse(created);
}

async function updateRole(id, role) {
  const current = await userRepository.findById(id);
  if (!current) throw new ApiError("User not found", 404);
  if (current.role === "ADMIN" && role !== "ADMIN" && current.isActive) {
    const adminsCount = await userRepository.countActiveAdmins();
    if (adminsCount <= 1) {
      throw new ApiError(LAST_ADMIN_BLOCK_MESSAGE, 400);
    }
  }

  const updated = await userRepository.updateById(id, {
    role,
    barberId: role === "BARBER" ? current.barberId : null,
    clientId: role === "CLIENT" ? current.clientId : null,
  });
  return toResponse(updated);
}

async function linkBarber(id, barberId) {
  const [current, barber] = await Promise.all([
    userRepository.findById(id),
    userRepository.findBarberById(barberId),
  ]);

  if (!current) throw new ApiError("User not found", 404);
  if (!barber) throw new ApiError("Barber not found", 404);
  if (current.role !== "BARBER") {
    throw new ApiError("User must have BARBER role to be linked", 400);
  }

  const updated = await userRepository.updateById(id, {
    barberId,
  });
  return toResponse(updated);
}

async function deleteUser(id, actorUserId) {
  const current = await userRepository.findById(id);
  if (!current) throw new ApiError("User not found", 404);
  if (current.id === actorUserId) {
    throw new ApiError("You cannot delete your own user", 400);
  }
  if (current.role === "ADMIN" && current.isActive) {
    const adminsCount = await userRepository.countActiveAdmins();
    if (adminsCount <= 1) {
      throw new ApiError(LAST_ADMIN_BLOCK_MESSAGE, 400);
    }
  }

  await userRepository.deleteById(id);
  return { ok: true };
}

module.exports = {
  listUsers,
  createUser,
  updateRole,
  linkBarber,
  deleteUser,
};
