const serviceService = require("./service.service");

async function list(req, res, next) {
  try {
    const rows = await serviceService.list(req.query);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const row = await serviceService.getById(Number(req.params.id));
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const row = await serviceService.create(req.body);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const row = await serviceService.update(Number(req.params.id), req.body);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const row = await serviceService.updateStatus(Number(req.params.id), req.body.isActive);
    res.status(200).json(row);
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
};
