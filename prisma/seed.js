const bcrypt = require("bcrypt");
const { PrismaClient, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@agendabarberia.com" },
    update: {
      fullName: "Admin Agenda Barberia",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      fullName: "Admin Agenda Barberia",
      email: "admin@agendabarberia.com",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.barber.upsert({
    where: { email: "barber1@agendabarberia.com" },
    update: {
      fullName: "Barbero Demo",
      phone: "1122334455",
      notes: "Barbero inicial de pruebas",
      isActive: true,
    },
    create: {
      fullName: "Barbero Demo",
      phone: "1122334455",
      email: "barber1@agendabarberia.com",
      notes: "Barbero inicial de pruebas",
      isActive: true,
    },
  });

  await prisma.client.upsert({
    where: { email: "client1@agendabarberia.com" },
    update: {
      fullName: "Cliente Demo",
      phone: "1199988877",
      notes: "Cliente inicial de pruebas",
    },
    create: {
      fullName: "Cliente Demo",
      phone: "1199988877",
      email: "client1@agendabarberia.com",
      notes: "Cliente inicial de pruebas",
    },
  });

  await prisma.service.upsert({
    where: { name: "Corte Clasico" },
    update: {
      description: "Corte tradicional",
      durationMin: 30,
      price: 8000,
      isActive: true,
    },
    create: {
      name: "Corte Clasico",
      description: "Corte tradicional",
      durationMin: 30,
      price: 8000,
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: { name: "Corte + Barba" },
    update: {
      description: "Servicio combinado",
      durationMin: 45,
      price: 12000,
      isActive: true,
    },
    create: {
      name: "Corte + Barba",
      description: "Servicio combinado",
      durationMin: 45,
      price: 12000,
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
