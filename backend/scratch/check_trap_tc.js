const prisma = require("../src/lib/prisma");
async function main() {
  const problem = await prisma.problem.findUnique({
    where: { slug: "trapping-rain-water" },
    include: { testCases: true },
  });
  if (!problem) { console.log("Problem not found!"); return; }
  console.log(`Problem: ${problem.title}`);
  console.log(`Test cases: ${problem.testCases.length}`);
  problem.testCases.forEach((tc, i) => {
    console.log(`  TC${i+1}: input="${tc.input}" expected="${tc.output}" hidden=${tc.isHidden}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
