/**
 * Prisma DB Seed
 * Run via:  npm run db:seed
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding CodeVerify database …");

  // ── 1. Admin user ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@codeverify.dev" },
    update: {},
    create: {
      email: "admin@codeverify.dev",
      username: "admin",
      passwordHash,
      trustScore: 100.0,
      totalSolved: 0,
    },
  });
  console.log(`✅  User created: ${admin.username}`);

  // Clear existing test cases to ensure new ones are added on re-seed
  await prisma.testCase.deleteMany({
    where: { problem: { slug: { in: ["two-sum", "longest-substring-without-repeating-characters", "valid-parentheses", "container-with-most-water", "trapping-rain-water"] } } }
  });

  // ── 2. Sample Problem — Two Sum ────────────────────────────────
  const TWO_SUM_STARTER = {
    python: `def twoSum(nums, target):
    # Write your solution here
    pass`,
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your solution here
}`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
  };

  const TWO_SUM_RUNNER = {
    python: `
import sys, json
_lines = sys.stdin.read().strip().split('\\n')
_nums = json.loads(_lines[0])
_target = int(_lines[1].strip())
_result = twoSum(_nums, _target)
print(json.dumps(_result, separators=(',', ':')))`,
    javascript: `
const lines = require('fs').readFileSync(0,'utf-8').trim().split('\\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1]);
console.log(JSON.stringify(twoSum(nums, target)));`,
  };

  const twoSum = await prisma.problem.upsert({
    where: { slug: "two-sum" },
    update: {
      starterCode: TWO_SUM_STARTER,
      codeRunner: TWO_SUM_RUNNER,
      testCases: {
        create: [
          { input: "[2,7,11,15]\n9", output: "[0,1]", isHidden: false },
          { input: "[3,2,4]\n6",      output: "[1,2]", isHidden: true  },
          { input: "[3,3]\n6",        output: "[0,1]", isHidden: true  },
          { input: "[0,4,3,0]\n0",    output: "[0,3]", isHidden: true  },
          { input: "[-1,-2,-3,-4,-5]\n-8", output: "[2,4]", isHidden: true },
          { input: "[10,20,30,40,50,60,70,80,90,100]\n190", output: "[8,9]", isHidden: true },
          { input: "[1,2,3,4,5,6,7,8,9,20]\n29", output: "[8,9]", isHidden: true },
          { input: "[1000000000, 1000000000]\n2000000000", output: "[0,1]", isHidden: true },
        ],
      },
    },
    create: {
      title: "Two Sum",
      slug: "two-sum",
      description:
        "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
      difficulty: "EASY",
      topics: ["Array", "Hash Table"],
      constraints:
        "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
      sampleInput: "nums = [2,7,11,15], target = 9",
      sampleOutput: "[0,1]",
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: TWO_SUM_STARTER,
      codeRunner: TWO_SUM_RUNNER,
      testCases: {
        create: [
          { input: "[2,7,11,15]\n9", output: "[0,1]", isHidden: false },
          { input: "[3,2,4]\n6",      output: "[1,2]", isHidden: true  },
          { input: "[3,3]\n6",        output: "[0,1]", isHidden: true  },
          { input: "[0,4,3,0]\n0",    output: "[0,3]", isHidden: true  },
          { input: "[-1,-2,-3,-4,-5]\n-8", output: "[2,4]", isHidden: true },
          { input: "[10,20,30,40,50,60,70,80,90,100]\n190", output: "[8,9]", isHidden: true },
          { input: "[1,2,3,4,5,6,7,8,9,20]\n29", output: "[8,9]", isHidden: true },
          { input: "[1000000000, 1000000000]\n2000000000", output: "[0,1]", isHidden: true },
        ],
      },
    },
  });
  console.log(`✅  Problem created: ${twoSum.title}`);

  // ── 3. Sample Problem — Longest Substring Without Repeating ────
  const longestSub = await prisma.problem.upsert({
    where: { slug: "longest-substring-without-repeating-characters" },
    update: {
      starterCode: {
        python: `def lengthOfLongestSubstring(s):\n    # Write your solution here\n    pass`,
        javascript: `/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n    // Write your solution here\n}`,
        java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      },
      codeRunner: {
        python: `\nimport sys\n_s = sys.stdin.read().rstrip('\\r\\n')\nprint(lengthOfLongestSubstring(_s))`,
        javascript: `\nconst fs = require('fs');\nconst s = fs.readFileSync(0, 'utf-8').replace(/\\r?\\n$/, '');\nconsole.log(lengthOfLongestSubstring(s));`,
      },
      testCases: {
        create: [
          { input: "abcabcbb", output: "3", isHidden: false },
          { input: "bbbbb",    output: "1", isHidden: true  },
          { input: "pwwkew",   output: "3", isHidden: true  },
          { input: " ",        output: "1", isHidden: true  },
          { input: "au",       output: "2", isHidden: true  },
          { input: "dvdf",     output: "3", isHidden: true  },
          { input: "abcdefghijklmnopqrstuvwxyz", output: "26", isHidden: true },
          { input: "aab",      output: "2", isHidden: true  },
          { input: "cdd",      output: "2", isHidden: true  },
          { input: "abba",     output: "2", isHidden: true  },
        ],
      },
    },
    create: {
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-without-repeating-characters",
      description:
        "Given a string `s`, find the length of the longest substring without repeating characters.",
      difficulty: "MEDIUM",
      topics: ["String", "Sliding Window", "Hash Table"],
      constraints:
        "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
      sampleInput: 's = "abcabcbb"',
      sampleOutput: "3",
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: {
        python: `def lengthOfLongestSubstring(s):\n    # Write your solution here\n    pass`,
        javascript: `/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n    // Write your solution here\n}`,
        java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your solution here\n        return 0;\n    }\n};`,
      },
      codeRunner: {
        python: `\nimport sys\n_s = sys.stdin.read().rstrip('\\r\\n')\nprint(lengthOfLongestSubstring(_s))`,
        javascript: `\nconst fs = require('fs');\nconst s = fs.readFileSync(0, 'utf-8').replace(/\\r?\\n$/, '');\nconsole.log(lengthOfLongestSubstring(s));`,
      },
      testCases: {
        create: [
          { input: "abcabcbb", output: "3", isHidden: false },
          { input: "bbbbb",    output: "1", isHidden: true  },
          { input: "pwwkew",   output: "3", isHidden: true  },
          { input: " ",        output: "1", isHidden: true  },
          { input: "au",       output: "2", isHidden: true  },
          { input: "dvdf",     output: "3", isHidden: true  },
          { input: "abcdefghijklmnopqrstuvwxyz", output: "26", isHidden: true },
          { input: "aab",      output: "2", isHidden: true  },
          { input: "cdd",      output: "2", isHidden: true  },
          { input: "abba",     output: "2", isHidden: true  },
        ],
      },
    },
  });
  console.log(`✅  Problem created: ${longestSub.title}`);

  // ── 4. Sample Problem — Valid Parentheses ───────────────────────
  const VALID_PAREN_STARTER = {
    python: `def isValid(s):
    # Write your solution here
    pass`,
    javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your solution here
}`,
    java: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}`,
    cpp: `class Solution {
public:
    bool isValid(string s) {
        // Write your solution here
        return false;
    }
};`,
  };

  const VALID_PAREN_RUNNER = {
    python: `
import sys
_s = sys.stdin.read().strip()
print(str(isValid(_s)).lower())`,
    javascript: `
const _s = require('fs').readFileSync(0, 'utf-8').trim();
console.log(isValid(_s));`,
  };

  const validParen = await prisma.problem.upsert({
    where: { slug: "valid-parentheses" },
    update: {
      starterCode: VALID_PAREN_STARTER,
      codeRunner: VALID_PAREN_RUNNER,
      testCases: {
        create: [
          { input: "()",       output: "true",  isHidden: false },
          { input: "()[]{}",   output: "true",  isHidden: false },
          { input: "(]",       output: "false", isHidden: false },
          { input: "([)]",     output: "false", isHidden: true  },
          { input: "{[]}",     output: "true",  isHidden: true  },
          { input: "",         output: "true",  isHidden: true  },
          { input: "(((((",    output: "false", isHidden: true  },
          { input: "))))",     output: "false", isHidden: true  },
          { input: "{[()]}",   output: "true",  isHidden: true  },
          { input: "([{}])()", output: "true",  isHidden: true  },
        ],
      },
    },
    create: {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      description:
        "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
      difficulty: "EASY",
      topics: ["String", "Stack"],
      constraints:
        "0 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'",
      sampleInput: 's = "()[]{}"',
      sampleOutput: "true",
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: VALID_PAREN_STARTER,
      codeRunner: VALID_PAREN_RUNNER,
      testCases: {
        create: [
          { input: "()",       output: "true",  isHidden: false },
          { input: "()[]{}",   output: "true",  isHidden: false },
          { input: "(]",       output: "false", isHidden: false },
          { input: "([)]",     output: "false", isHidden: true  },
          { input: "{[]}",     output: "true",  isHidden: true  },
          { input: "",         output: "true",  isHidden: true  },
          { input: "(((((",    output: "false", isHidden: true  },
          { input: "))))",     output: "false", isHidden: true  },
          { input: "{[()]}",   output: "true",  isHidden: true  },
          { input: "([{}])()", output: "true",  isHidden: true  },
        ],
      },
    },
  });
  console.log(`✅  Problem created: ${validParen.title}`);

  // ── 5. Sample Problem — Container With Most Water ──────────────
  const CONTAINER_STARTER = {
    python: `def maxArea(height):
    # Write your solution here
    pass`,
    javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
    // Write your solution here
}`,
    java: `class Solution {
    public int maxArea(int[] height) {
        // Write your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int maxArea(vector<int>& height) {
        // Write your solution here
        return 0;
    }
};`,
  };

  const CONTAINER_RUNNER = {
    python: `
import sys, json
_height = json.loads(sys.stdin.read().strip())
print(maxArea(_height))`,
    javascript: `
const _height = JSON.parse(require('fs').readFileSync(0, 'utf-8').trim());
console.log(maxArea(_height));`,
  };

  const containerWater = await prisma.problem.upsert({
    where: { slug: "container-with-most-water" },
    update: {
      starterCode: CONTAINER_STARTER,
      codeRunner: CONTAINER_RUNNER,
      testCases: {
        create: [
          { input: "[1,8,6,2,5,4,8,3,7]", output: "49", isHidden: false },
          { input: "[1,1]",                 output: "1",  isHidden: false },
          { input: "[4,3,2,1,4]",           output: "16", isHidden: true  },
          { input: "[1,2,1]",               output: "2",  isHidden: true  },
          { input: "[2,3,4,5,18,17,6]",     output: "17", isHidden: true  },
          { input: "[1,2,3,4,5,6,7,8,9,10]", output: "25", isHidden: true },
          { input: "[10,9,8,7,6,5,4,3,2,1]", output: "25", isHidden: true },
          { input: "[1,8,6,2,5,4,8,25,7]",  output: "49", isHidden: true  },
          { input: "[5,5,5,5,5]",           output: "20", isHidden: true  },
          { input: "[1,100,100,1]",          output: "100", isHidden: true },
        ],
      },
    },
    create: {
      title: "Container With Most Water",
      slug: "container-with-most-water",
      description:
        "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\n**Notice** that you may not slant the container.",
      difficulty: "MEDIUM",
      topics: ["Array", "Two Pointers", "Greedy"],
      constraints:
        "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
      sampleInput: "height = [1,8,6,2,5,4,8,3,7]",
      sampleOutput: "49",
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: CONTAINER_STARTER,
      codeRunner: CONTAINER_RUNNER,
      testCases: {
        create: [
          { input: "[1,8,6,2,5,4,8,3,7]", output: "49", isHidden: false },
          { input: "[1,1]",                 output: "1",  isHidden: false },
          { input: "[4,3,2,1,4]",           output: "16", isHidden: true  },
          { input: "[1,2,1]",               output: "2",  isHidden: true  },
          { input: "[2,3,4,5,18,17,6]",     output: "17", isHidden: true  },
          { input: "[1,2,3,4,5,6,7,8,9,10]", output: "25", isHidden: true },
          { input: "[10,9,8,7,6,5,4,3,2,1]", output: "25", isHidden: true },
          { input: "[1,8,6,2,5,4,8,25,7]",  output: "49", isHidden: true  },
          { input: "[5,5,5,5,5]",           output: "20", isHidden: true  },
          { input: "[1,100,100,1]",          output: "100", isHidden: true },
        ],
      },
    },
  });
  console.log(`✅  Problem created: ${containerWater.title}`);

  // ── 6. Sample Problem — Trapping Rain Water (HARD) ────────────
  const TRAP_STARTER = {
    python: `def trap(height):
    # Write your solution here
    pass`,
    javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Write your solution here
}`,
    java: `class Solution {
    public int trap(int[] height) {
        // Write your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int trap(vector<int>& height) {
        // Write your solution here
        return 0;
    }
};`,
  };

  const TRAP_RUNNER = {
    python: `
import sys, json
_height = json.loads(sys.stdin.read().strip())
print(trap(_height))`,
    javascript: `
const _height = JSON.parse(require('fs').readFileSync(0, 'utf-8').trim());
console.log(trap(_height));`,
  };

  const trappingWater = await prisma.problem.upsert({
    where: { slug: "trapping-rain-water" },
    update: {
      starterCode: TRAP_STARTER,
      codeRunner: TRAP_RUNNER,
      testCases: {
        create: [
          { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", output: "6",  isHidden: false },
          { input: "[4,2,0,3,2,5]",               output: "9",  isHidden: false },
          { input: "[]",                           output: "0",  isHidden: true  },
          { input: "[3]",                          output: "0",  isHidden: true  },
          { input: "[3,0,3]",                      output: "3",  isHidden: true  },
          { input: "[5,4,1,2]",                    output: "1",  isHidden: true  },
          { input: "[0,0,0,0]",                    output: "0",  isHidden: true  },
          { input: "[2,0,2]",                      output: "2",  isHidden: true  },
          { input: "[3,1,2,1,3]",                  output: "5",  isHidden: true  },
          { input: "[5,2,1,2,1,5]",                output: "14", isHidden: true  },
        ],
      },
    },
    create: {
      title: "Trapping Rain Water",
      slug: "trapping-rain-water",
      description:
        "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.\n\nFor each bar at index `i`, the water trapped on top of it is determined by the minimum of the maximum height to its left and the maximum height to its right, minus its own height.",
      difficulty: "HARD",
      topics: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
      constraints:
        "n == height.length\n0 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
      sampleInput: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
      sampleOutput: "6",
      timeLimit: 1000,
      memoryLimit: 256,
      starterCode: TRAP_STARTER,
      codeRunner: TRAP_RUNNER,
      testCases: {
        create: [
          { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", output: "6",  isHidden: false },
          { input: "[4,2,0,3,2,5]",               output: "9",  isHidden: false },
          { input: "[]",                           output: "0",  isHidden: true  },
          { input: "[3]",                          output: "0",  isHidden: true  },
          { input: "[3,0,3]",                      output: "3",  isHidden: true  },
          { input: "[5,4,1,2]",                    output: "1",  isHidden: true  },
          { input: "[0,0,0,0]",                    output: "0",  isHidden: true  },
          { input: "[2,0,2]",                      output: "2",  isHidden: true  },
          { input: "[3,1,2,1,3]",                  output: "5",  isHidden: true  },
          { input: "[5,2,1,2,1,5]",                output: "14", isHidden: true  },
        ],
      },
    },
  });
  console.log(`✅  Problem created: ${trappingWater.title}`);

  // ── 7. Sample Contest ──────────────────────────────────────────
  const now = new Date();
  const startTime = new Date(now.getTime() + 60 * 60 * 1000);
  const endTime   = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const contest = await prisma.contest.create({
    data: {
      title: "CodeVerify Weekly #1",
      description: "First weekly contest on CodeVerify platform.",
      startTime,
      endTime,
      isPublic: true,
      createdBy: admin.id,
      problems: {
        create: [
          { problemId: twoSum.id,          points: 100, orderIndex: 0 },
          { problemId: longestSub.id,       points: 200, orderIndex: 1 },
          { problemId: validParen.id,       points: 100, orderIndex: 2 },
          { problemId: containerWater.id,   points: 200, orderIndex: 3 },
          { problemId: trappingWater.id,    points: 300, orderIndex: 4 },
        ],
      },
    },
  });
  console.log(`✅  Contest created: ${contest.title}`);

  console.log("\n🎉  Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
