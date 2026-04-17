const prisma        = require("../lib/prisma");
const { getRedisClient } = require("../lib/redis");
const AppError      = require("../utils/AppError");

const CACHE_TTL = 300; // 5 minutes

// ── GET /problems ─────────────────────────────────────────────────────────────
async function listProblems(req, res, next) {
  try {
    const page       = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit      = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip       = (page - 1) * limit;
    const difficulty = req.query.difficulty?.toUpperCase();
    const topic      = req.query.topic;
    const search     = req.query.search;

    const where = {
      ...(difficulty && { difficulty }),
      ...(topic      && { topics: { has: topic } }),
      ...(search     && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { slug:  { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, title: true, slug: true, difficulty: true, topics: true,
          totalAttempts: true, totalAccepted: true, timeLimit: true, memoryLimit: true,
        },
      }),
      prisma.problem.count({ where }),
    ]);

    res.json({
      success: true,
      data: problems,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /problems/:slug ───────────────────────────────────────────────────────
async function getProblem(req, res, next) {
  try {
    const { slug } = req.params;
    const redis    = getRedisClient();
    const cacheKey = `problem:${slug}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, data: JSON.parse(cached), cached: true });

    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: {
          where: { isHidden: false },
          select: { id: true, input: true, output: true, isHidden: true },
        },
      },
    });
    if (!problem) return next(new AppError("Problem not found", 404, "NOT_FOUND"));

    await redis.set(cacheKey, JSON.stringify(problem), "EX", CACHE_TTL);
    res.json({ success: true, data: problem });
  } catch (err) {
    next(err);
  }
}

// ── POST /problems (admin) ────────────────────────────────────────────────────
async function createProblem(req, res, next) {
  try {
    const {
      title, slug, description, difficulty, topics, constraints,
      sampleInput, sampleOutput, timeLimit, memoryLimit, testCases = [],
    } = req.body;

    const problem = await prisma.problem.create({
      data: {
        title, slug, description, difficulty, topics, constraints,
        sampleInput, sampleOutput, timeLimit, memoryLimit,
        testCases: { create: testCases },
      },
      include: { testCases: true },
    });

    res.status(201).json({ success: true, data: problem });
  } catch (err) {
    if (err.code === "P2002") return next(new AppError("Slug already exists", 409, "SLUG_TAKEN"));
    next(err);
  }
}

module.exports = { listProblems, getProblem, createProblem };
