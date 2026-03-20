const scheduleService = require("./schedule.service");

async function list(req, res, next) {
  try {
    const rows = await scheduleService.list(req.query);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const row = await scheduleService.getById(Number(req.params.id));
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const row = await scheduleService.create(req.body);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const row = await scheduleService.update(Number(req.params.id), req.body);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const row = await scheduleService.updateStatus(Number(req.params.id), req.body.isWorkingDay);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const row = await scheduleService.remove(Number(req.params.id));
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function listByBarber(req, res, next) {
  try {
    const rows = await scheduleService.list({ barberId: Number(req.params.barberId) });
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function createForBarber(req, res, next) {
  try {
    const payload = { ...req.body, barberId: Number(req.params.barberId) };
    const row = await scheduleService.create(payload);
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
  updateStatus,
  remove,
  listByBarber,
  createForBarber,
};
