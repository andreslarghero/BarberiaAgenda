const { verifyToken } = require("../config/jwt");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      barberId: payload.barberId ?? null,
      clientId: payload.clientId ?? null,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

function requireAdmin(req, res, next) {
  return requireRoles("ADMIN")(req, res, next);
}

function requireAdminOrSelfBarberParam(paramName = "barberId") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role === "ADMIN") {
      return next();
    }
    if (req.user.role !== "BARBER") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const targetBarberId = Number(req.params[paramName]);
    if (!targetBarberId || req.user.barberId !== targetBarberId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRoles,
  requireAdmin,
  requireAdminOrSelfBarberParam,
};
