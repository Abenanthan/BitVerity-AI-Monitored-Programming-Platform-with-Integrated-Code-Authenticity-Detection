const prisma = require("../src/lib/prisma");

async function main() {
  const sub = await prisma.submission.findFirst({
    orderBy: { submittedAt: 'desc' },
  });
  console.log(JSON.stringify(sub, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
