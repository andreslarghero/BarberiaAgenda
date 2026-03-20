const { Router } = require("express");
const { requireAuth } = require("../../middlewares/auth.middleware");
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
router.get("/", validate(listServicesSchema), serviceController.list);
router.get("/:id", validate(idParamSchema), serviceController.getById);
router.post("/", validate(createServiceSchema), serviceController.create);
router.put(
  "/:id",
  validate(idParamSchema),
  validate(replaceServiceSchema),
  serviceController.update
);
router.patch(
  "/:id/status",
  validate(idParamSchema),
  validate(updateServiceStatusSchema),
  serviceController.updateStatus
);

module.exports = router;
