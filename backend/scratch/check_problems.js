const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const problems = await prisma.problem.findMany({
    select: { title: true, slug: true, difficulty: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Total problems in DB: ${problems.length}`);
  problems.forEach((p, i) => console.log(`  ${i+1}. [${p.difficulty}] ${p.title}`));
}

main().finally(() => prisma.$disconnect());
