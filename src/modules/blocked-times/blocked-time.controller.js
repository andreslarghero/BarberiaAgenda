const blockedTimeService = require("./blocked-time.service");

async function list(req, res, next) {
  try {
    const rows = await blockedTimeService.list(req.query);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const row = await blockedTimeService.getById(Number(req.params.id));
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const row = await blockedTimeService.create(req.body);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const row = await blockedTimeService.update(Number(req.params.id), req.body);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const row = await blockedTimeService.remove(Number(req.params.id));
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function listByBarber(req, res, next) {
  try {
    const rows = await blockedTimeService.list({ barberId: Number(req.params.barberId) });
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function createForBarber(req, res, next) {
  try {
    const payload = { ...req.body, barberId: Number(req.params.barberId) };
    const row = await blockedTimeService.create(payload);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  listByBarber,
  createForBarber,
};
