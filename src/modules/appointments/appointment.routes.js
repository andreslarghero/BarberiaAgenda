const { Router } = require("express");
const { requireAuth } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const appointmentController = require("./appointment.controller");
const {
  idParamSchema,
  listAppointmentsSchema,
  appointmentAvailabilitySchema,
  createAppointmentSchema,
  replaceAppointmentSchema,
  cancelAppointmentSchema,
} = require("./appointment.schema");

const router = Router();

router.use(requireAuth);
router.get("/", validate(listAppointmentsSchema), appointmentController.list);
router.get("/availability", validate(appointmentAvailabilitySchema), appointmentController.availability);
router.get("/:id", validate(idParamSchema), appointmentController.getById);
router.post("/", validate(createAppointmentSchema), appointmentController.create);
router.put(
  "/:id",
  validate(idParamSchema),
  validate(replaceAppointmentSchema),
  appointmentController.update
);
router.patch(
  "/:id/cancel",
  validate(idParamSchema),
  validate(cancelAppointmentSchema),
  appointmentController.cancel
);
router.patch("/:id/complete", validate(idParamSchema), appointmentController.complete);

module.exports = router;
