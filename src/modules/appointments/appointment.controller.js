const appointmentService = require("./appointment.service");

async function list(req, res, next) {
  try {
    const rows = await appointmentService.list(req.query, req.user);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const row = await appointmentService.getById(Number(req.params.id), req.user);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const row = await appointmentService.create(req.body, req.user);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const row = await appointmentService.update(Number(req.params.id), req.body, req.user);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const row = await appointmentService.cancel(Number(req.params.id), req.body.reason, req.user);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function complete(req, res, next) {
  try {
    const row = await appointmentService.complete(Number(req.params.id), req.user);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

async function availability(req, res, next) {
  try {
    const data = await appointmentService.getAvailability(req.query, req.user);
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
  cancel,
  complete,
  availability,
};
