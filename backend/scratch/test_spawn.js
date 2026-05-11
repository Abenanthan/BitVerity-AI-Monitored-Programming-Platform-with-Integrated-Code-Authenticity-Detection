const { spawnSync } = require('child_process');
const fs = require('fs');

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

import sys, json
_height = json.loads(sys.stdin.read().strip())
print(maxArea(_height))`;

fs.writeFileSync('temp_test.py', code);

const start = Date.now();
const child = spawnSync('python', ['temp_test.py'], {
  input: "[1,1]",
  timeout: 1000,
  encoding: "utf-8"
});

console.log("Status:", child.status);
console.log("Stdout:", child.stdout);
console.log("Stderr:", child.stderr);
console.log("Error:", child.error);
console.log("Runtime:", Date.now() - start);
