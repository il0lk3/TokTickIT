import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMINISTRATOR' } });
  console.log('Admins:', admins);
}
main().finally(() => prisma.$disconnect());
