const prisma   = require("../lib/prisma");
const { getRedisClient } = require("../lib/redis");
const AppError = require("../utils/AppError");

const USER_CACHE_TTL = 10 * 60; // 10 minutes

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/me  (auth required — check Redis cache first)
// Key: cache:user:{userId}
// ─────────────────────────────────────────────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const userId  = req.user.id;
    const redis   = getRedisClient();
    const cacheKey = `cache:user:${userId}`;

    // Cache check
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), cached: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, avatarUrl: true,
        trustScore: true, totalSolved: true, createdAt: true,
        styleProfile: {
          select: {
            avgLineLength: true, camelCaseRatio: true, snakeCaseRatio: true,
            docstringFrequency: true, commentFrequency: true,
            avgFuncLength: true, preferredLoops: true,
            sampleCount: true, updatedAt: true,
          },
        },
      },
    });
    if (!user) return next(new AppError("User not found", 404, "NOT_FOUND"));

    // Cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(user), "EX", USER_CACHE_TTL);

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:username  (public profile)
// ─────────────────────────────────────────────────────────────────────────────
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true, username: true, avatarUrl: true,
        trustScore: true, totalSolved: true, createdAt: true,
        styleProfile: {
          select: {
            avgLineLength: true, camelCaseRatio: true, snakeCaseRatio: true,
            docstringFrequency: true, commentFrequency: true,
            avgFuncLength: true, preferredLoops: true,
            sampleCount: true, updatedAt: true,
          },
        },
      },
    });
    if (!user) return next(new AppError("User not found", 404, "NOT_FOUND"));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:username/submissions
// ─────────────────────────────────────────────────────────────────────────────
async function getUserSubmissions(req, res, next) {
  try {
    const { username } = req.params;
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip  = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) return next(new AppError("User not found", 404, "NOT_FOUND"));

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where:   { userId: user.id },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, verdict: true, language: true, aiVerdict: true,
          aiScore: true, runtime: true, memory: true, submittedAt: true,
          problem: { select: { id: true, title: true, slug: true, difficulty: true } },
        },
      }),
      prisma.submission.count({ where: { userId: user.id } }),
    ]);

    res.json({
      success: true,
      data: submissions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/users/me
// ─────────────────────────────────────────────────────────────────────────────
async function updateMe(req, res, next) {
  try {
    const { avatarUrl } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data:  { avatarUrl },
      select: { id: true, email: true, username: true, avatarUrl: true, trustScore: true },
    });

    // Invalidate cache
    const redis = getRedisClient();
    await redis.del(`cache:user:${userId}`);

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/leaderboard
// ─────────────────────────────────────────────────────────────────────────────
async function leaderboard(req, res, next) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit || "50", 10));
    const users = await prisma.user.findMany({
      orderBy: [{ totalSolved: "desc" }, { trustScore: "desc" }],
      take: limit,
      select: {
        id: true, username: true, avatarUrl: true,
        trustScore: true, totalSolved: true,
      },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function getDashboardData(req, res, next) {
  try {
    const userId = req.user.id;

    const [user, recentSubmissions, activeContests, recommendedProblems] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { trustScore: true, totalSolved: true, username: true }
      }),
      prisma.submission.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true, verdict: true, language: true, aiScore: true, submittedAt: true,
          problem: { select: { title: true, slug: true } }
        }
      }),
      prisma.contest.findMany({
        where: { endTime: { gt: new Date() } },
        take: 2,
        orderBy: { startTime: "asc" },
        select: { id: true, title: true, startTime: true, endTime: true, _count: { select: { contestUsers: true, problems: true } } }
      }),
      prisma.problem.findMany({
        where: {
          submissions: {
            none: { userId, verdict: "ACCEPTED" }
          }
        },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, slug: true, difficulty: true, topics: true }
      })
    ]);

    // Calculate AI Flags (submissions with high AI score)
    const aiFlags = await prisma.submission.count({
      where: { userId, aiScore: { gte: 0.7 } }
    });

    res.json({
      success: true,
      data: {
        stats: {
          trustScore: user.trustScore,
          problemsSolved: user.totalSolved,
          contestsWon: 0, // Mocked for now
          currentStreak: 0, // Mocked for now
          aiFlags
        },
        recentSubmissions,
        activeContests: activeContests.map(c => ({
          ...c,
          participantCount: c._count.contestUsers,
          problemCount: c._count.problems
        })),
        recommendedProblems
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, getProfile, getUserSubmissions, updateMe, leaderboard, getDashboardData };
