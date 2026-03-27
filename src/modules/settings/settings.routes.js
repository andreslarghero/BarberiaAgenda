const { Router } = require("express");
const { requireAuth, requireAdmin } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const settingsController = require("./settings.controller");
const { updateSettingsSchema } = require("./settings.schema");

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get("/", settingsController.get);
router.put("/", validate(updateSettingsSchema), settingsController.update);

module.exports = router;
