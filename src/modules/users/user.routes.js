const { Router } = require("express");
const { requireAuth, requireAdmin } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const userController = require("./user.controller");
const { idParamSchema, createUserSchema, updateRoleSchema, linkBarberSchema } = require("./user.schema");

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/", userController.list);
router.post("/", validate(createUserSchema), userController.create);
router.patch("/:id/role", validate(idParamSchema), validate(updateRoleSchema), userController.updateRole);
router.patch(
  "/:id/link-barber",
  validate(idParamSchema),
  validate(linkBarberSchema),
  userController.linkBarber
);
router.delete("/:id", validate(idParamSchema), userController.remove);

module.exports = router;
