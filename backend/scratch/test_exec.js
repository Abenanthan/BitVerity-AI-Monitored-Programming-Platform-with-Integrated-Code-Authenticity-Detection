// executeLocally test

const code = `def twoSum(nums, target):
    # Loop through each pair of indices
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]`;

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
const expectedOutput = "[0,1]";
const timeLimit = 1000;
const langId = 71;

// Because executeLocally is not exported, we must just copy its logic here to test.
// Wait, I can't require it if it's not exported. Let me just copy the logic.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

function executeLocallyTest() {
  const tempDir = path.join(process.cwd(), "temp_execution");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  
  const fileId = uuidv4();
  const runnerHarness = codeRunner.python;
  const filepath = path.join(tempDir, `${fileId}.py`);
  fs.writeFileSync(filepath, code + '\n' + runnerHarness);
  
  const command = "python3"; // Or maybe "python"? The image is node:20-alpine, which doesn't have python by default!
  const args = [filepath];

  const child = spawnSync("python", args, {
    input: input,
    timeout: timeLimit,
    encoding: "utf-8"
  });

  console.log("child.error:", child.error);
  console.log("child.status:", child.status);
  console.log("child.stdout:", child.stdout);
  console.log("child.stderr:", child.stderr);
}

executeLocallyTest();
