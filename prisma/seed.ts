import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_USER_NAME = 'local';

async function main() {
  // Mono-usuario: nos aseguramos de que exista un único usuario por defecto.
  const existing = await prisma.user.findFirst({ where: { name: DEFAULT_USER_NAME } });
  if (existing) {
    console.log(`[seed] usuario existente: ${existing.id}`);
    return;
  }
  const user = await prisma.user.create({ data: { name: DEFAULT_USER_NAME } });
  console.log(`[seed] usuario creado: ${user.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
