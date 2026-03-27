const reminderRepository = require("./reminder.repository");

const HOUR_MS = 60 * 60 * 1000;

function formatReminderLog({ appointment, reminderType, hoursUntilStart }) {
  const roundedHours = Math.round(hoursUntilStart * 100) / 100;
  return [
    `[Reminder:${reminderType}]`,
    `turno=${appointment.id}`,
    `cliente="${appointment.client?.fullName || "N/A"}"`,
    `telefono="${appointment.client?.phone || "N/A"}"`,
    `barbero="${appointment.barber?.fullName || "N/A"}"`,
    `servicio="${appointment.service?.name || "N/A"}"`,
    `startsAt=${appointment.startsAt.toISOString()}`,
    `faltan_horas=${roundedHours}`,
  ].join(" ");
}

async function process24hReminder(appointment, hoursUntilStart) {
  const in24hWindow = hoursUntilStart > 23 && hoursUntilStart <= 24;
  if (!in24hWindow || appointment.reminder24hSent) {
    return 0;
  }

  const result = await reminderRepository.markReminder24hSent(appointment.id);
  if (result.count === 1) {
    console.log(
      formatReminderLog({
        appointment,
        reminderType: "24h",
        hoursUntilStart,
      })
    );
    return 1;
  }

  return 0;
}

async function process2hReminder(appointment, hoursUntilStart) {
  const in2hWindow = hoursUntilStart > 1 && hoursUntilStart <= 2;
  if (!in2hWindow || appointment.reminder2hSent) {
    return 0;
  }

  const result = await reminderRepository.markReminder2hSent(appointment.id);
  if (result.count === 1) {
    console.log(
      formatReminderLog({
        appointment,
        reminderType: "2h",
        hoursUntilStart,
      })
    );
    return 1;
  }

  return 0;
}

async function runRemindersCheck() {
  const now = new Date();
  const upTo24h = new Date(now.getTime() + 24 * HOUR_MS);

  const appointments = await reminderRepository.findUpcomingWithinRange({
    fromDate: now,
    toDate: upTo24h,
  });

  let sent24h = 0;
  let sent2h = 0;

  for (const appointment of appointments) {
    const hoursUntilStart = (appointment.startsAt.getTime() - now.getTime()) / HOUR_MS;
    sent24h += await process24hReminder(appointment, hoursUntilStart);
    sent2h += await process2hReminder(appointment, hoursUntilStart);
  }

  const summary = {
    scannedUpcoming: appointments.length,
    sent24h,
    sent2h,
    checkedAt: now.toISOString(),
  };

  console.log("[ReminderCheck:summary]", JSON.stringify(summary));
  return summary;
}

module.exports = {
  runRemindersCheck,
};
