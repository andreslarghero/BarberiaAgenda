const prisma = require("../src/config/prisma");
const { runRemindersCheck } = require("../src/modules/reminders/reminder.service");

async function main() {
  await runRemindersCheck();
}

main()
  .catch((error) => {
    console.error("[ReminderCheck:error]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
