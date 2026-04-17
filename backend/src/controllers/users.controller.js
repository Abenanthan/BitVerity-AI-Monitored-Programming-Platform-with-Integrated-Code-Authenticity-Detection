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

module.exports = { getMe, getProfile, getUserSubmissions, updateMe, leaderboard };
