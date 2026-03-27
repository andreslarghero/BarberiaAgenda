const { Router } = require("express");
const { requireAuth, requireAdmin } = require("../../middlewares/auth.middleware");
const reminderController = require("./reminder.controller");

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);
router.post("/check", reminderController.check);

module.exports = router;
