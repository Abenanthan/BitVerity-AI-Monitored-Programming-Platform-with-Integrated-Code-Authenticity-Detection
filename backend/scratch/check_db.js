const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const report = await prisma.detectionReport.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
