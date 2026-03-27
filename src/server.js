const app = require("./app");
const { env } = require("./config/env");
const { startRemindersScheduler } = require("./modules/reminders/reminder.scheduler");

const server = app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`);
});
const remindersScheduler = startRemindersScheduler();

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[Agenda Barbería] El puerto ${env.PORT} ya está en uso. ` +
        "Cerrá la otra terminal donde corre el backend, o el proceso Node que sigue usando ese puerto, y volvé a ejecutar npm run dev."
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

function shutdown() {
  remindersScheduler.stop();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
