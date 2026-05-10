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
  
  if (langId === 71) { // python
    const runnerHarness = (!hasStdinReading && codeRunner?.python) ? codeRunner.python : '';
    filepath = path.join(tempDir, `${fileId}.py`);
    fs.writeFileSync(filepath, code + '\n' + runnerHarness);
    command = "python";
    args = [filepath];
  }

  const start = Date.now();
  const child = spawnSync(command, args, {
    input: input,
    timeout: timeLimit,
    encoding: "utf-8"
  });
  const runtime = Date.now() - start;

  try { fs.unlinkSync(filepath); } catch (e) {}

  const out = (child.stdout || "").trim();
  const errOut = (child.stderr || "").trim();

  return { out, errOut, runtime };
}

const code = `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`;

const codeRunner = {
  python: `
import sys, json
_lines = sys.stdin.read().strip().split('\\n')
_nums = json.loads(_lines[0])
_target = int(_lines[1].strip())
_result = twoSum(_nums, _target)
print(json.dumps(_result, separators=(',', ':')))`
};

const input = "[2,7,11,15]\n9";

const res = executeLocally(code, 71, input, "[0,1]", 1000, codeRunner);
console.log("STDOUT:", res.out);
console.log("STDERR:", res.errOut);
