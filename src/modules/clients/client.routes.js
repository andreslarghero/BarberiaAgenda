const { Router } = require("express");
const { requireAuth } = require("../../middlewares/auth.middleware");
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
router.get("/", validate(listClientsSchema), clientController.list);
router.get("/:id", validate(idParamSchema), clientController.getById);
router.post("/", validate(createClientSchema), clientController.create);
router.put(
  "/:id",
  validate(idParamSchema),
  validate(replaceClientSchema),
  clientController.update
);

module.exports = router;
