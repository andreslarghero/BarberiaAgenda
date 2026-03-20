const authService = require("./auth.service");

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  const result = authService.getMe(req.user);
  res.status(200).json(result);
}

module.exports = { login, me };
