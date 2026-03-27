const clientService = require("./client.service");

async function list(req, res, next) {
  try {
    const rows = await clientService.list(req.query, req.user);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const row = await clientService.getById(Number(req.params.id), req.user);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const row = await clientService.create(req.body);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const row = await clientService.update(Number(req.params.id), req.body);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function history(req, res, next) {
  try {
    const data = await clientService.getHistory(Number(req.params.id), req.user);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  history,
};
