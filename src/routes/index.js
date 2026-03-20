const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const barberRoutes = require("../modules/barbers/barber.routes");
const clientRoutes = require("../modules/clients/client.routes");
const serviceRoutes = require("../modules/services/service.routes");
const appointmentRoutes = require("../modules/appointments/appointment.routes");
const scheduleRoutes = require("../modules/schedules/schedule.routes");
const blockedTimeRoutes = require("../modules/blocked-times/blocked-time.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/barbers", barberRoutes);
router.use("/clients", clientRoutes);
router.use("/services", serviceRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/blocked-times", blockedTimeRoutes);

module.exports = router;
