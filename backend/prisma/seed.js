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

  // ── 2. Sample Problem — Two Sum ────────────────────────────────
  const twoSum = await prisma.problem.upsert({
    where: { slug: "two-sum" },
    update: {},
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
      testCases: {
        create: [
          { input: "[2,7,11,15]\n9", output: "[0,1]", isHidden: false },
          { input: "[3,2,4]\n6",      output: "[1,2]", isHidden: true  },
          { input: "[3,3]\n6",        output: "[0,1]", isHidden: true  },
        ],
      },
    },
  });
  console.log(`✅  Problem created: ${twoSum.title}`);

  // ── 3. Sample Problem — Longest Substring Without Repeating ────
  const longestSub = await prisma.problem.upsert({
    where: { slug: "longest-substring-without-repeating-characters" },
    update: {},
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
      testCases: {
        create: [
          { input: "abcabcbb", output: "3", isHidden: false },
          { input: "bbbbb",    output: "1", isHidden: true  },
          { input: "pwwkew",   output: "3", isHidden: true  },
        ],
      },
    },
  });
  console.log(`✅  Problem created: ${longestSub.title}`);

  // ── 4. Sample Contest ──────────────────────────────────────────
  const now = new Date();
  const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
  const endTime   = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 hours

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
          { problemId: twoSum.id,     points: 100, orderIndex: 0 },
          { problemId: longestSub.id, points: 200, orderIndex: 1 },
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
