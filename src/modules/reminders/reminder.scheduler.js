const { env } = require("../../config/env");
const { runRemindersCheck } = require("./reminder.service");

function startRemindersScheduler() {
  if (!env.REMINDERS_ENABLED) {
    console.log("[ReminderScheduler] disabled (REMINDERS_ENABLED=false)");
    return { stop() {} };
  }

  const intervalMs = env.REMINDERS_INTERVAL_MINUTES * 60 * 1000;
  let isRunning = false;

  console.log(
    `[ReminderScheduler] started interval=${env.REMINDERS_INTERVAL_MINUTES}m`
  );

  const executeCheck = async () => {
    if (isRunning) {
      console.log("[ReminderScheduler] previous run still in progress, skipping");
      return;
    }

    isRunning = true;
    console.log("[ReminderScheduler] run started");
    try {
      const summary = await runRemindersCheck();
      console.log("[ReminderScheduler] run finished", JSON.stringify(summary));
    } catch (error) {
      console.error("[ReminderScheduler] run error", error);
    } finally {
      isRunning = false;
    }
  };

  // Run once on startup so reminders don't wait full interval.
  executeCheck();
  const intervalId = setInterval(executeCheck, intervalMs);

  return {
    stop() {
      clearInterval(intervalId);
      console.log("[ReminderScheduler] stopped");
    },
  };
}

module.exports = {
  startRemindersScheduler,
};
