const prisma = require("../src/config/prisma");

const TEST_TAG = "[REMINDER_TEST]";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

async function getRequiredEntities() {
  const [admin, barber, client, service] = await Promise.all([
    prisma.user.findUnique({ where: { email: "admin@agendabarberia.com" } }),
    prisma.barber.findUnique({ where: { email: "barber1@agendabarberia.com" } }),
    prisma.client.findUnique({ where: { email: "client1@agendabarberia.com" } }),
    prisma.service.findUnique({ where: { name: "Corte Clasico" } }),
  ]);

  if (!admin || !barber || !client || !service) {
    throw new Error(
      "Faltan datos base para test. Ejecuta `npm run prisma:seed` y vuelve a intentar."
    );
  }

  return { admin, barber, client, service };
}

async function cleanupPreviousTestAppointments() {
  const result = await prisma.appointment.deleteMany({
    where: { notes: { startsWith: TEST_TAG } },
  });
  return result.count;
}

async function createTestAppointments({ admin, barber, client, service }) {
  const now = new Date();

  const testCases = [
    {
      key: "CASE_24H",
      status: "PENDING",
      startsAt: addMinutes(now, 23 * 60 + 30), // 23.5h => ventana 24h
      notes: `${TEST_TAG} CASE_24H`,
    },
    {
      key: "CASE_2H",
      status: "PENDING",
      startsAt: addMinutes(now, 90), // 1.5h => ventana 2h
      notes: `${TEST_TAG} CASE_2H`,
    },
    {
      key: "CASE_OUTSIDE",
      status: "PENDING",
      startsAt: addMinutes(now, 30 * 60), // 30h => fuera de ambas ventanas
      notes: `${TEST_TAG} CASE_OUTSIDE`,
    },
    {
      key: "CASE_CANCELLED",
      status: "CANCELLED",
      startsAt: addMinutes(now, 23 * 60 + 20), // en 24h, pero cancelado
      notes: `${TEST_TAG} CASE_CANCELLED`,
      cancelledAt: now,
      cancelReason: "Cancelado para validar reminders",
    },
  ];

  const created = [];

  for (const item of testCases) {
    const endsAt = addMinutes(item.startsAt, service.durationMin);
    const appointment = await prisma.appointment.create({
      data: {
        barberId: barber.id,
        clientId: client.id,
        serviceId: service.id,
        createdById: admin.id,
        startsAt: item.startsAt,
        endsAt,
        status: item.status,
        notes: item.notes,
        cancelledAt: item.cancelledAt || null,
        cancelReason: item.cancelReason || null,
        reminder24hSent: false,
        reminder2hSent: false,
      },
      select: {
        id: true,
        startsAt: true,
        status: true,
        notes: true,
      },
    });
    created.push(appointment);
  }

  return created;
}

async function main() {
  const entities = await getRequiredEntities();
  const deletedCount = await cleanupPreviousTestAppointments();
  const created = await createTestAppointments(entities);

  console.log(
    "[ReminderTestSetup:summary]",
    JSON.stringify({
      deletedPrevious: deletedCount,
      createdCount: created.length,
      created,
    })
  );
}

main()
  .catch((error) => {
    console.error("[ReminderTestSetup:error]", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
