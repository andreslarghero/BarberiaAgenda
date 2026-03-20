const { Router } = require("express");
const { requireAuth } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const scheduleController = require("./schedule.controller");
const {
  idParamSchema,
  listSchedulesSchema,
  createScheduleSchema,
  replaceScheduleSchema,
  updateScheduleStatusSchema,
} = require("./schedule.schema");

const router = Router();

router.use(requireAuth);
router.get("/", validate(listSchedulesSchema), scheduleController.list);
router.get("/:id", validate(idParamSchema), scheduleController.getById);
router.post("/", validate(createScheduleSchema), scheduleController.create);
router.put(
  "/:id",
  validate(idParamSchema),
  validate(replaceScheduleSchema),
  scheduleController.update
);
router.patch(
  "/:id/status",
  validate(idParamSchema),
  validate(updateScheduleStatusSchema),
  scheduleController.updateStatus
);
router.delete("/:id", validate(idParamSchema), scheduleController.remove);

module.exports = router;
