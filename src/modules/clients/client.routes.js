const { Router } = require("express");
const { requireAuth, requireAdmin, requireRoles } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const clientController = require("./client.controller");
const {
  idParamSchema,
  listClientsSchema,
  createClientSchema,
  replaceClientSchema,
} = require("./client.schema");

const router = Router();

router.use(requireAuth);
router.get("/", requireRoles("ADMIN", "CLIENT"), validate(listClientsSchema), clientController.list);
router.get("/:id/history", requireRoles("ADMIN", "CLIENT"), validate(idParamSchema), clientController.history);
router.get("/:id", requireRoles("ADMIN", "CLIENT"), validate(idParamSchema), clientController.getById);
router.post("/", requireAdmin, validate(createClientSchema), clientController.create);
router.put(
  "/:id",
  requireAdmin,
  validate(idParamSchema),
  validate(replaceClientSchema),
  clientController.update
);

module.exports = router;
