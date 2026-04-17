const { v4: uuidv4 } = require("uuid");
const axios    = require("axios");
const prisma   = require("../lib/prisma");
const { getRedisClient } = require("../lib/redis");
const AppError = require("../utils/AppError");
const logger   = require("../utils/logger");

const JUDGE0_URL    = process.env.JUDGE0_API_URL        || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_KEY    = process.env.JUDGE0_API_KEY        || "";
const DETECTION_URL = process.env.DETECTION_SERVICE_URL || "http://localhost:8000";
const BEHAVIOR_TTL  = 2 * 60 * 60; // 2 hours (contest duration)

// Judge0 language IDs
const LANGUAGE_IDS = {
  python:     71,
  java:       62,
  cpp:        54,
  javascript: 63,
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/submissions
// ─────────────────────────────────────────────────────────────────────────────
async function createSubmission(req, res, next) {
  try {
    const { problemId, contestId, code, language, behaviorLog } = req.body;
    const userId = req.user.id;

    const langId = LANGUAGE_IDS[language?.toLowerCase()];
    if (!langId)
      return next(new AppError(`Unsupported language: ${language}`, 400, "UNSUPPORTED_LANGUAGE"));

    const problem = await prisma.problem.findUnique({
      where:   { id: problemId },
      include: { testCases: { where: { isHidden: true } } },
    });
    if (!problem) return next(new AppError("Problem not found", 404, "NOT_FOUND"));

    // ── 1. Store behavior log in Redis (KEY 1: behavior:{sessionId}) ──────────
    const sessionId = uuidv4();
    if (Array.isArray(behaviorLog) && behaviorLog.length > 0) {
      const redis = getRedisClient();
      await redis.set(
        `behavior:${sessionId}`,
        JSON.stringify(behaviorLog),
        "EX",
        BEHAVIOR_TTL
      );
      logger.debug(`Behavior log stored → behavior:${sessionId} (${behaviorLog.length} events)`);
    }

    // ── 2. Save submission record (PENDING) ───────────────────────────────────
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        contestId: contestId || null,
        code,
        language,
        verdict:       "PENDING",
        behaviorLogId: sessionId,
      },
    });

    // ── 3. Respond immediately — processing is async ──────────────────────────
    res.status(202).json({
      success: true,
      data: { id: submission.id, verdict: "PENDING", sessionId },
    });

    // ── 4. Run Judge0 + AI detection asynchronously ───────────────────────────
    setImmediate(() =>
      judgeSubmission(submission, problem, code, langId, sessionId, contestId, behaviorLog).catch((e) =>
        logger.error("judgeSubmission error:", e)
      )
    );
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: Judge0 execution pipeline
// ─────────────────────────────────────────────────────────────────────────────
async function judgeSubmission(submission, problem, code, langId, sessionId, contestId, behaviorLog) {
  const redis = getRedisClient();

  let finalVerdict = "ACCEPTED";
  let totalRuntime = 0;
  let totalMemory  = 0;

  for (const tc of problem.testCases) {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code:     code,
        language_id:     langId,
        stdin:           tc.input,
        expected_output: tc.output,
        cpu_time_limit:  problem.timeLimit / 1000,
        memory_limit:    problem.memoryLimit * 1024,
      },
      {
        headers: {
          "X-RapidAPI-Key":  JUDGE0_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "Content-Type":    "application/json",
        },
        timeout: 30000,
      }
    );

    const r = response.data;
    totalRuntime += parseFloat(r.time || "0") * 1000;
    totalMemory  += r.memory || 0;

    if (r.status?.id !== 3) {
      const verdictMap = {
        4:  "WRONG_ANSWER",
        5:  "TIME_LIMIT_EXCEEDED",
        6:  "COMPILE_ERROR",
        11: "RUNTIME_ERROR",
        12: "MEMORY_LIMIT_EXCEEDED",
      };
      finalVerdict = verdictMap[r.status?.id] || "RUNTIME_ERROR";
      break;
    }
  }

  const count      = Math.max(problem.testCases.length, 1);
  const avgRuntime = Math.round(totalRuntime / count);
  const avgMemory  = Math.round(totalMemory  / count);

  // ── Update submission with judge result ────────────────────────────────────
  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data:  { verdict: finalVerdict, runtime: avgRuntime, memory: avgMemory },
  });

  // ── Update problem acceptance counter ──────────────────────────────────────
  await prisma.problem.update({
    where: { id: submission.problemId },
    data: {
      totalAttempts: { increment: 1 },
      ...(finalVerdict === "ACCEPTED" && { totalAccepted: { increment: 1 } }),
    },
  });

  // ── Invalidate problem cache ───────────────────────────────────────────────
  const problem2 = await prisma.problem.findUnique({
    where: { id: submission.problemId }, select: { slug: true },
  });
  if (problem2) await redis.del(`cache:problem:${problem2.slug}`);

  // ── First accepted — increment totalSolved & update contest leaderboard ────
  if (finalVerdict === "ACCEPTED") {
    const prevAc = await prisma.submission.count({
      where: {
        userId:    submission.userId,
        problemId: submission.problemId,
        verdict:   "ACCEPTED",
        id:        { not: submission.id },
      },
    });

    if (prevAc === 0) {
      await prisma.user.update({
        where: { id: submission.userId },
        data:  { totalSolved: { increment: 1 } },
      });
      // Invalidate user cache
      await redis.del(`cache:user:${submission.userId}`);
    }

    // ── Update contest leaderboard sorted set (KEY 3: leaderboard:{contestId}) ─
    if (contestId) {
      const cp = await prisma.contestProblem.findUnique({
        where: { contestId_problemId: { contestId, problemId: submission.problemId } },
        select: { points: true },
      });
      if (cp) {
        const lbKey = `leaderboard:${contestId}`;
        await redis.zincrby(lbKey, cp.points, submission.userId);
        logger.debug(`Leaderboard updated → ${lbKey}: +${cp.points} for ${submission.userId}`);

        // Also persist score to PostgreSQL for durability
        const newScore = await redis.zscore(lbKey, submission.userId);
        await prisma.contestUser.update({
          where: { userId_contestId: { userId: submission.userId, contestId } },
          data:  { score: parseInt(newScore, 10) },
        });

        // Broadcast leaderboard update
        const topTenRaw = await redis.zrevrange(lbKey, 0, 9, "WITHSCORES");
        const topTen = [];
        for (let i = 0; i < topTenRaw.length; i += 2) {
          topTen.push({ userId: topTenRaw[i], score: parseInt(topTenRaw[i + 1], 10) });
        }
        await redis.publish("realtime:events", JSON.stringify({
          room: `contest:${contestId}`,
          event: "contest:leaderboard:update",
          data: { contestId, topTen }
        }));
      }
    }
  }

  // ── Emit real-time update via Redis pub/sub ────────────────────────────────
  await redis.publish(
    "realtime:events",
    JSON.stringify({
      room: `user:${submission.userId}`,
      event: "submission:verdict",
      data: {
        submissionId: submission.id,
        verdict: finalVerdict,
        runtime: avgRuntime,
        memory: avgMemory
      }
    })
  );

  // ── Trigger AI detection (non-blocking) ───────────────────────────────────
  setImmediate(() =>
    runDetection(updated, behaviorLog).catch((e) => logger.error("Detection error:", e))
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: call Python detection microservice
// ─────────────────────────────────────────────────────────────────────────────
async function runDetection(submission, behaviorLog) {
  try {
    const { data } = await axios.post(`${DETECTION_URL}/detect/analyze`, {
      submissionId: submission.id,
      userId:       submission.userId,
      code:         submission.code,
      language:     submission.language,
      behaviorLog:  behaviorLog || [],
    });

    const report = data; // FastAPI returns it directly, not wrapped in { report: ... }

    await prisma.detectionReport.create({
      data: {
        submissionId:        submission.id,
        behavioralScore:     report.behavioralScore,
        codePatternScore:    report.codePatternScore,
        fingerprintScore:    report.fingerprintScore,
        explainabilityScore: 0.5,
        finalAiScore:        report.finalAiScore,
        aiVerdict:           report.aiVerdict,
        flags:               report.flags,
        trustScoreDelta:     report.trustScoreDelta,
      },
    });

    await prisma.submission.update({
      where: { id: submission.id },
      data:  { aiScore: report.finalAiScore, aiVerdict: report.aiVerdict },
    });

    await prisma.user.update({
      where: { id: submission.userId },
      data:  { trustScore: { increment: report.trustScoreDelta } },
    });

    // Invalidate user cache after trust score change
    const redis = getRedisClient();
    await redis.del(`cache:user:${submission.userId}`);

    await redis.publish(
      "realtime:events",
      JSON.stringify({
        room: `user:${submission.userId}`,
        event: "submission:detection",
        data: {
          submissionId: submission.id,
          aiScore: report.finalAiScore,
          aiVerdict: report.aiVerdict,
          flags: report.flags,
          trustScoreDelta: report.trustScoreDelta
        }
      })
    );
  } catch (err) {
    logger.warn(`Detection service unavailable for submission ${submission.id}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/submissions/:id
// ─────────────────────────────────────────────────────────────────────────────
async function getSubmission(req, res, next) {
  try {
    const submission = await prisma.submission.findUnique({
      where:   { id: req.params.id },
      include: {
        detectionReport: true,
        problem: { select: { title: true, slug: true, difficulty: true } },
      },
    });
    if (!submission) return next(new AppError("Submission not found", 404, "NOT_FOUND"));

    // Only the owner sees code + detection details
    if (submission.userId !== req.user.id) {
      const { code: _, detectionReport: __, ...safe } = submission;
      return res.json({ success: true, data: safe });
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/submissions  (my submissions)
// ─────────────────────────────────────────────────────────────────────────────
async function listSubmissions(req, res, next) {
  try {
    const page      = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit     = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip      = (page - 1) * limit;
    const problemId = req.query.problemId;
    const verdict   = req.query.verdict?.toUpperCase();
    const contestId = req.query.contestId;

    const where = {
      userId: req.user.id,
      ...(problemId && { problemId }),
      ...(verdict   && { verdict }),
      ...(contestId && { contestId }),
    };

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, verdict: true, language: true, aiVerdict: true,
          aiScore: true, runtime: true, memory: true, submittedAt: true,
          problem: { select: { title: true, slug: true, difficulty: true } },
        },
      }),
      prisma.submission.count({ where }),
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

module.exports = { createSubmission, getSubmission, listSubmissions };
