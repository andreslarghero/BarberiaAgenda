const { ApiError } = require("../../utils/api-error");
const { runRemindersCheck } = require("./reminder.service");

async function check(req, res, next) {
  try {
    if (req.user?.role !== "ADMIN") {
      throw new ApiError("Forbidden", 403);
    }

    const summary = await runRemindersCheck();
    res.status(200).json({
      message: "Reminder check executed",
      summary,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  check,
};
