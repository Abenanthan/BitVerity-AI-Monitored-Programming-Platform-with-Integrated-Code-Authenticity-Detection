const prisma = require("../src/lib/prisma");
async function main() {
  const sub = await prisma.submission.findFirst({
    where: { problem: { slug: "container-with-most-water" } },
    orderBy: { submittedAt: 'desc' },
  });
  if (!sub) { console.log("No submission found!"); return; }
  console.log(`Verdict: ${sub.verdict}`);
  sub.testCaseResults.forEach((tc, i) => {
    console.log(`  TC${i+1} [${tc.passed ? 'PASS' : 'FAIL'}]: Input: ${tc.input} | Expected: ${tc.expected} | Got: ${tc.output}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
