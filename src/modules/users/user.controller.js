const userService = require("./user.service");

async function list(req, res, next) {
  try {
    const rows = await userService.listUsers();
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const row = await userService.createUser(req.body);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const row = await userService.updateRole(Number(req.params.id), req.body.role);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function linkBarber(req, res, next) {
  try {
    const row = await userService.linkBarber(Number(req.params.id), req.body.barberId);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const result = await userService.deleteUser(Number(req.params.id), req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  updateRole,
  linkBarber,
  remove,
};
