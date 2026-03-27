const settingsService = require("./settings.service");

async function get(req, res, next) {
  try {
    const data = await settingsService.getSettings();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await settingsService.updateSettings(req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  get,
  update,
};
