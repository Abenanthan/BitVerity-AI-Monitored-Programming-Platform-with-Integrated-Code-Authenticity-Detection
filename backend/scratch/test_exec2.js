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
  
  if (langId === 71) {
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

  if (child.error && child.error.code === 'ETIMEDOUT') {
    return { status: "TIME_LIMIT_EXCEEDED", runtime, memory: 0, stdout: out, stderr: errOut };
  }
  if (child.status !== 0) {
    return { status: "RUNTIME_ERROR", runtime, memory: 0, stdout: out, stderr: errOut };
  }
  return { status: "ACCEPTED", runtime, memory: 0, stdout: out, stderr: errOut };
}

const code = `from typing import List

def maxArea(height: List[int]) -> int:
    left, right = 0, len(height) - 1
    max_area = 0

    while left < right:
        # Calculate area between left and right
        width = right - left
        current_area = min(height[left], height[right]) * width
        max_area = max(max_area, current_area)

        # Move the pointer with the smaller height inward
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1

    return max_area
`;

const runner = {
    python: `
import sys, json
_height = json.loads(sys.stdin.read().strip())
print(maxArea(_height))`
};

const result = executeLocally(code, 71, "[1,1]", "1", 1000, runner);
console.log(result);

const result2 = executeLocally(code, 71, "[1,8,6,2,5,4,8,3,7]", "49", 1000, runner);
console.log(result2);
