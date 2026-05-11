const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function executeLocally(code, langId, input, expectedOutput, timeLimit, codeRunner) {
  const tempDir = path.join(process.cwd(), "temp_execution");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  
  const fileId = uuidv4();
  let filepath, command, args;

  const hasStdinReading = /sys\.stdin|input\s*\(|__name__|readFileSync|fs\.read/.test(code);
  const runnerHarness = (!hasStdinReading && codeRunner?.python) ? codeRunner.python : '';
  filepath = path.join(tempDir, `${fileId}.py`);
  fs.writeFileSync(filepath, code + '\n' + runnerHarness);
  command = "python";
  args = [filepath];

  const child = spawnSync(command, args, {
    input: input,
    timeout: timeLimit,
    encoding: "utf-8"
  });

  try { fs.unlinkSync(filepath); } catch (e) {}

  return { 
    status: child.error?.code === 'ETIMEDOUT' ? "TIME_LIMIT_EXCEEDED" : (child.status !== 0 ? "RUNTIME_ERROR" : "ACCEPTED"), 
    stdout: (child.stdout || "").trim() 
  };
}

const prisma = require("../src/lib/prisma");

async function main() {
  const problem = await prisma.problem.findUnique({
    where: { slug: "container-with-most-water" },
    include: { testCases: true },
  });
  
  const sub = await prisma.submission.findFirst({
    where: { problem: { slug: "container-with-most-water" } },
    orderBy: { submittedAt: 'desc' },
  });

  const code = sub.code;
  
  console.log("Testing Container With Most Water locally...");
  for (const tc of problem.testCases) {
    const r = executeLocally(code, 71, tc.input, tc.output, 1000, problem.codeRunner);
    console.log(`Input: ${tc.input} => Status: ${r.status}, Out: ${r.stdout}`);
  }
}
main().finally(() => prisma.$disconnect());
