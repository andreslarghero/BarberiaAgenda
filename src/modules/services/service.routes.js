const { Router } = require("express");
const { requireAuth, requireAdmin, requireRoles } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const serviceController = require("./service.controller");
const {
  idParamSchema,
  listServicesSchema,
  createServiceSchema,
  replaceServiceSchema,
  updateServiceStatusSchema,
} = require("./service.schema");

const router = Router();

router.use(requireAuth);
router.get("/", requireRoles("ADMIN", "BARBER", "CLIENT"), validate(listServicesSchema), serviceController.list);
router.get("/:id", requireRoles("ADMIN", "BARBER", "CLIENT"), validate(idParamSchema), serviceController.getById);
router.post("/", requireAdmin, validate(createServiceSchema), serviceController.create);
router.put(
  "/:id",
  requireAdmin,
  validate(idParamSchema),
  validate(replaceServiceSchema),
  serviceController.update
);
router.patch(
  "/:id/status",
  requireAdmin,
  validate(idParamSchema),
  validate(updateServiceStatusSchema),
  serviceController.updateStatus
);

module.exports = router;
