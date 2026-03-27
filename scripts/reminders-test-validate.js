const prisma = require("../src/config/prisma");
const { runRemindersCheck } = require("../src/modules/reminders/reminder.service");

const TEST_TAG = "[REMINDER_TEST]";

async function readTestAppointments() {
  return prisma.appointment.findMany({
    where: {
      notes: {
        startsWith: TEST_TAG,
      },
    },
    orderBy: {
      notes: "asc",
    },
    select: {
      id: true,
      notes: true,
      status: true,
      startsAt: true,
      reminder24hSent: true,
      reminder2hSent: true,
    },
  });
}

function buildCaseResultMap(rows) {
  const map = {};
  for (const row of rows) {
    const caseName = row.notes.replace(`${TEST_TAG} `, "");
    map[caseName] = {
      id: row.id,
      status: row.status,
      startsAt: row.startsAt.toISOString(),
      reminder24hSent: row.reminder24hSent,
      reminder2hSent: row.reminder2hSent,
    };
  }
  return map;
}

function evaluateCases(afterFirstRun, afterSecondRun, firstSummary, secondSummary) {
  return {
    CASE_24H: {
      expected: "Primer run: reminder24hSent=true y reminder2hSent=false",
      ok:
        afterFirstRun.CASE_24H?.reminder24hSent === true &&
        afterFirstRun.CASE_24H?.reminder2hSent === false,
    },
    CASE_2H: {
      expected: "Primer run: reminder2hSent=true y reminder24hSent=false",
      ok:
        afterFirstRun.CASE_2H?.reminder2hSent === true &&
        afterFirstRun.CASE_2H?.reminder24hSent === false,
    },
    CASE_OUTSIDE: {
      expected: "Sin cambios en flags (fuera de ventanas)",
      ok:
        afterFirstRun.CASE_OUTSIDE?.reminder24hSent === false &&
        afterFirstRun.CASE_OUTSIDE?.reminder2hSent === false,
    },
    CASE_CANCELLED: {
      expected: "Sin cambios en flags (cancelado)",
      ok:
        afterFirstRun.CASE_CANCELLED?.reminder24hSent === false &&
        afterFirstRun.CASE_CANCELLED?.reminder2hSent === false,
    },
    CASE_NO_DUPLICATION: {
      expected: "Segundo run sin envíos nuevos (sent24h=0 y sent2h=0)",
      ok: secondSummary.sent24h === 0 && secondSummary.sent2h === 0,
    },
    RUN_COUNTS: {
      expected: "Primer run con 1 envío 24h y 1 envío 2h",
      ok: firstSummary.sent24h === 1 && firstSummary.sent2h === 1,
    },
    FLAGS_STABLE_SECOND_RUN: {
      expected: "Flags iguales entre primer y segundo run",
      ok: JSON.stringify(afterFirstRun) === JSON.stringify(afterSecondRun),
    },
  };
}

async function main() {
  const before = buildCaseResultMap(await readTestAppointments());
  if (!Object.keys(before).length) {
    throw new Error(
      "No hay datos de prueba de reminders. Ejecuta primero `npm run reminders:test:setup`."
    );
  }

  const firstSummary = await runRemindersCheck();
  const afterFirstRun = buildCaseResultMap(await readTestAppointments());

  const secondSummary = await runRemindersCheck();
  const afterSecondRun = buildCaseResultMap(await readTestAppointments());

  const checks = evaluateCases(afterFirstRun, afterSecondRun, firstSummary, secondSummary);

  console.log(
    "[ReminderTestValidate:summary]",
    JSON.stringify(
      {
        firstSummary,
        secondSummary,
        before,
        afterFirstRun,
        afterSecondRun,
        checks,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[ReminderTestValidate:error]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
