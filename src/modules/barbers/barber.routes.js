const { Router } = require("express");
const { requireAuth } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const barberController = require("./barber.controller");
const scheduleController = require("../schedules/schedule.controller");
const blockedTimeController = require("../blocked-times/blocked-time.controller");
const {
  idParamSchema,
  listBarbersSchema,
  createBarberSchema,
  replaceBarberSchema,
  updateBarberStatusSchema,
} = require("./barber.schema");
const {
  barberIdParamSchema: scheduleBarberIdParamSchema,
  createScheduleForBarberSchema,
} = require("../schedules/schedule.schema");
const {
  barberIdParamSchema: blockedBarberIdParamSchema,
  createBlockedTimeForBarberSchema,
} = require("../blocked-times/blocked-time.schema");

const router = Router();

router.use(requireAuth);
router.get("/", validate(listBarbersSchema), barberController.list);
router.get("/:id", validate(idParamSchema), barberController.getById);
router.post("/", validate(createBarberSchema), barberController.create);
router.put(
  "/:id",
  validate(idParamSchema),
  validate(replaceBarberSchema),
  barberController.update
);
router.patch(
  "/:id/status",
  validate(idParamSchema),
  validate(updateBarberStatusSchema),
  barberController.updateStatus
);
router.get(
  "/:barberId/schedules",
  validate(scheduleBarberIdParamSchema),
  scheduleController.listByBarber
);
router.post(
  "/:barberId/schedules",
  validate(scheduleBarberIdParamSchema),
  validate(createScheduleForBarberSchema),
  scheduleController.createForBarber
);
router.get(
  "/:barberId/blocked-times",
  validate(blockedBarberIdParamSchema),
  blockedTimeController.listByBarber
);
router.post(
  "/:barberId/blocked-times",
  validate(blockedBarberIdParamSchema),
  validate(createBlockedTimeForBarberSchema),
  blockedTimeController.createForBarber
);

module.exports = router;
