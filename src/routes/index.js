const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const barberRoutes = require("../modules/barbers/barber.routes");
const clientRoutes = require("../modules/clients/client.routes");
const serviceRoutes = require("../modules/services/service.routes");
const appointmentRoutes = require("../modules/appointments/appointment.routes");
const scheduleRoutes = require("../modules/schedules/schedule.routes");
const blockedTimeRoutes = require("../modules/blocked-times/blocked-time.routes");
const reminderRoutes = require("../modules/reminders/reminder.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const settingsRoutes = require("../modules/settings/settings.routes");
const userRoutes = require("../modules/users/user.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/barbers", barberRoutes);
router.use("/clients", clientRoutes);
router.use("/services", serviceRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/blocked-times", blockedTimeRoutes);
router.use("/reminders", reminderRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);
router.use("/users", userRoutes);

module.exports = router;
