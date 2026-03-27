const { Router } = require("express");
const { requireAuth, requireAdmin } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const dashboardController = require("./dashboard.controller");
const { summarySchema, overviewSchema, commissionsSchema, exportSchema } = require("./dashboard.schema");

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get("/summary", validate(summarySchema), dashboardController.summary);
router.get("/overview", validate(overviewSchema), dashboardController.overview);
router.get("/commissions", validate(commissionsSchema), dashboardController.commissions);
router.get("/export/appointments", validate(exportSchema), dashboardController.exportAppointments);
router.get("/export/summary", validate(exportSchema), dashboardController.exportSummary);
router.get("/export/commissions", validate(exportSchema), dashboardController.exportCommissions);

module.exports = router;
