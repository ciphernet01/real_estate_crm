import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {
      name: 'System Admin',
      password,
      role: Role.ADMIN,
    },
    create: {
      name: 'System Admin',
      email: 'admin@crm.local',
      password,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'agent@crm.local' },
    update: {
      name: 'Demo Agent',
      password,
      role: Role.AGENT,
    },
    create: {
      name: 'Demo Agent',
      email: 'agent@crm.local',
      password,
      role: Role.AGENT,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
