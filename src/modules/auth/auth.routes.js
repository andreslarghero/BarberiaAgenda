const { Router } = require("express");
const validate = require("../../middlewares/validate.middleware");
const { requireAuth } = require("../../middlewares/auth.middleware");
const authController = require("./auth.controller");
const { loginSchema } = require("./auth.schema");

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", requireAuth, authController.me);

module.exports = router;
