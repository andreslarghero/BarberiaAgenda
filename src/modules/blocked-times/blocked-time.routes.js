const { Router } = require("express");
const { requireAuth, requireAdmin } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const blockedTimeController = require("./blocked-time.controller");
const {
  idParamSchema,
  listBlockedTimesSchema,
  createBlockedTimeSchema,
  replaceBlockedTimeSchema,
} = require("./blocked-time.schema");

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get("/", validate(listBlockedTimesSchema), blockedTimeController.list);
router.get("/:id", validate(idParamSchema), blockedTimeController.getById);
router.post("/", validate(createBlockedTimeSchema), blockedTimeController.create);
router.put(
  "/:id",
  validate(idParamSchema),
  validate(replaceBlockedTimeSchema),
  blockedTimeController.update
);
router.delete("/:id", validate(idParamSchema), blockedTimeController.remove);

module.exports = router;
