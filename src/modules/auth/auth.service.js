const bcrypt = require("bcrypt");
const { signToken } = require("../../config/jwt");
const { ApiError } = require("../../utils/api-error");
const authRepository = require("./auth.repository");

async function login(payload) {
  const user = await authRepository.findUserByEmail(payload.email);
  if (!user || !user.isActive) {
    throw new ApiError("Invalid credentials", 401);
  }

  const validPassword = await bcrypt.compare(payload.password, user.passwordHash);
  if (!validPassword) {
    throw new ApiError("Invalid credentials", 401);
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signToken(tokenPayload);

  return { accessToken, user: tokenPayload };
}

function getMe(user) {
  return { user };
}

module.exports = { login, getMe };
