const { Router } = require("express");
const {
  requireAuth,
  requireAdmin,
  requireRoles,
  requireAdminOrSelfBarberParam,
} = require("../../middlewares/auth.middleware");
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
router.get("/", requireRoles("ADMIN", "BARBER", "CLIENT"), validate(listBarbersSchema), barberController.list);
router.get("/:id", requireRoles("ADMIN", "BARBER", "CLIENT"), validate(idParamSchema), barberController.getById);
router.post("/", requireAdmin, validate(createBarberSchema), barberController.create);
router.put(
  "/:id",
  requireAdmin,
  validate(idParamSchema),
  validate(replaceBarberSchema),
  barberController.update
);
router.patch(
  "/:id/status",
  requireAdmin,
  validate(idParamSchema),
  validate(updateBarberStatusSchema),
  barberController.updateStatus
);
router.get(
  "/:barberId/schedules",
  requireAdminOrSelfBarberParam("barberId"),
  validate(scheduleBarberIdParamSchema),
  scheduleController.listByBarber
);
router.post(
  "/:barberId/schedules",
  requireAdminOrSelfBarberParam("barberId"),
  validate(scheduleBarberIdParamSchema),
  validate(createScheduleForBarberSchema),
  scheduleController.createForBarber
);
router.get(
  "/:barberId/blocked-times",
  requireAdminOrSelfBarberParam("barberId"),
  validate(blockedBarberIdParamSchema),
  blockedTimeController.listByBarber
);
router.post(
  "/:barberId/blocked-times",
  requireAdminOrSelfBarberParam("barberId"),
  validate(blockedBarberIdParamSchema),
  validate(createBlockedTimeForBarberSchema),
  blockedTimeController.createForBarber
);

module.exports = router;
