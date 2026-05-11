const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.problem.findUnique({
    where: { slug: 'two-sum' },
    include: { testCases: true }
  });
  console.log(JSON.stringify(p, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
