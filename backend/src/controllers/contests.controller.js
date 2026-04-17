const prisma   = require("../lib/prisma");
const { getRedisClient } = require("../lib/redis");
const AppError = require("../utils/AppError");
const logger   = require("../utils/logger");

const LB_PAGE_SIZE = 50; // max entries returned from leaderboard

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contests
// ─────────────────────────────────────────────────────────────────────────────
async function listContests(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "10", 10));
    const skip  = (page - 1) * limit;
    const now   = new Date();

    const phase = req.query.phase;
    let where   = { isPublic: true };
    if (phase === "upcoming") where = { ...where, startTime: { gt: now } };
    if (phase === "ongoing")  where = { ...where, startTime: { lte: now }, endTime: { gt: now } };
    if (phase === "past")     where = { ...where, endTime:   { lte: now } };

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
        select: {
          id: true, title: true, description: true,
          startTime: true, endTime: true, isPublic: true,
          _count: { select: { contestUsers: true, problems: true } },
        },
      }),
      prisma.contest.count({ where }),
    ]);

    res.json({
      success: true,
      data: contests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contests/:id
// ─────────────────────────────────────────────────────────────────────────────
async function getContest(req, res, next) {
  try {
    const contest = await prisma.contest.findUnique({
      where: { id: req.params.id },
      include: {
        problems: {
          orderBy: { orderIndex: "asc" },
          include: {
            problem: {
              select: { id: true, title: true, slug: true, difficulty: true, topics: true },
            },
          },
        },
        _count: { select: { contestUsers: true } },
      },
    });
    if (!contest) return next(new AppError("Contest not found", 404, "NOT_FOUND"));
    res.json({ success: true, data: contest });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contests
// ─────────────────────────────────────────────────────────────────────────────
async function createContest(req, res, next) {
  try {
    const { title, description, startTime, endTime, isPublic, problemIds = [] } = req.body;

    const contest = await prisma.contest.create({
      data: {
        title, description,
        startTime: new Date(startTime),
        endTime:   new Date(endTime),
        isPublic:  isPublic ?? true,
        createdBy: req.user.id,
        problems: {
          create: problemIds.map((pid, i) => ({
            problemId: pid, points: 100, orderIndex: i,
          })),
        },
      },
      include: { problems: true },
    });

    res.status(201).json({ success: true, data: contest });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contests/:id/join
// ─────────────────────────────────────────────────────────────────────────────
async function registerForContest(req, res, next) {
  try {
    const { id: contestId } = req.params;
    const userId = req.user.id;

    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) return next(new AppError("Contest not found", 404, "NOT_FOUND"));
    if (new Date() > contest.endTime) return next(new AppError("Contest has ended", 400, "CONTEST_ENDED"));

    const existing = await prisma.contestUser.findUnique({
      where: { userId_contestId: { userId, contestId } },
    });
    if (existing) return next(new AppError("Already registered", 409, "ALREADY_REGISTERED"));

    const cu = await prisma.contestUser.create({ data: { userId, contestId } });

    // Seed the sorted set with score 0 so the user appears on the board immediately
    const redis  = getRedisClient();
    const lbKey  = `leaderboard:${contestId}`;
    const exists = await redis.zscore(lbKey, userId);
    if (exists === null) {
      await redis.zadd(lbKey, "NX", 0, userId);
      logger.debug(`Leaderboard seeded → ${lbKey}: 0 for ${userId}`);
    }

    res.status(201).json({ success: true, data: cu });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contests/:id/leaderboard
// Read from Redis sorted set first; fall back to PostgreSQL on miss.
//
// Redis key:  leaderboard:{contestId}   (Sorted Set)
// ZREVRANGE   → top N by score descending
// ZREVRANK    → rank of a specific user
// ─────────────────────────────────────────────────────────────────────────────
async function contestLeaderboard(req, res, next) {
  try {
    const { id: contestId } = req.params;
    const top    = Math.min(LB_PAGE_SIZE, parseInt(req.query.limit || "50", 10));
    const redis  = getRedisClient();
    const lbKey  = `leaderboard:${contestId}`;

    // ── Try Redis Sorted Set first ────────────────────────────────────────────
    const rawEntries = await redis.zrevrange(lbKey, 0, top - 1, "WITHSCORES");

    if (rawEntries && rawEntries.length > 0) {
      // rawEntries = [userId, score, userId, score, ...]
      const pairs = [];
      for (let i = 0; i < rawEntries.length; i += 2) {
        pairs.push({ userId: rawEntries[i], score: parseInt(rawEntries[i + 1], 10) });
      }

      // Batch-fetch usernames + avatars
      const userIds = pairs.map((p) => p.userId);
      const users   = await prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, username: true, avatarUrl: true, trustScore: true },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      const ranked = pairs.map((p, i) => ({
        rank:      i + 1,
        score:     p.score,
        userId:    p.userId,
        username:  userMap[p.userId]?.username  || "Unknown",
        avatarUrl: userMap[p.userId]?.avatarUrl || null,
        trustScore: userMap[p.userId]?.trustScore || 0,
      }));

      return res.json({ success: true, data: ranked, source: "cache" });
    }

    // ── Redis miss — fall back to PostgreSQL and seed the sorted set ──────────
    logger.debug(`Leaderboard cache miss for contest ${contestId} — reading from DB`);

    const entries = await prisma.contestUser.findMany({
      where:   { contestId },
      orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
      take:    top,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, trustScore: true } },
      },
    });

    if (entries.length > 0) {
      // Seed the sorted set from DB for future requests
      const pipeline = redis.pipeline();
      for (const e of entries) {
        pipeline.zadd(lbKey, "NX", e.score, e.userId);
      }
      await pipeline.exec();
    }

    const ranked = entries.map((e, i) => ({ rank: i + 1, ...e }));
    res.json({ success: true, data: ranked, source: "db" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listContests, getContest, createContest, registerForContest, contestLeaderboard,
};
