const prisma = require("../src/lib/prisma");
async function main() {
  const sub = await prisma.submission.findFirst({
    where: { problem: { slug: "trapping-rain-water" } },
    orderBy: { submittedAt: 'desc' },
  });
  if (!sub) { console.log("No submission found for trapping-rain-water!"); return; }
  console.log(`Verdict: ${sub.verdict}`);
  console.log(`Code:\n${sub.code}\n`);
  console.log("Test case results:");
  sub.testCaseResults.forEach((tc, i) => {
    console.log(`  TC${i+1} [${tc.passed ? 'PASS' : 'FAIL'}]: input=${tc.input} expected=${tc.expected} got=${tc.output} status=${tc.status}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
