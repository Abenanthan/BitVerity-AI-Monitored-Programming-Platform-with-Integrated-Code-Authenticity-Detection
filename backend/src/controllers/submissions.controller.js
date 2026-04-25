const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
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
    const { problemId, contestId, code, language, behaviorLog, isRun, customInput } = req.body;
    const userId = req.user.id;

    const langId = LANGUAGE_IDS[language?.toLowerCase()];
    if (!langId)
      return next(new AppError(`Unsupported language: ${language}`, 400, "UNSUPPORTED_LANGUAGE"));

    const problem = await prisma.problem.findUnique({
      where:   { id: problemId },
      include: { testCases: true }, // Fetch all test cases
    });
    if (!problem) return next(new AppError("Problem not found", 404, "NOT_FOUND"));

    // ── Handle "Run Code" (Synchronous, no DB save) ──────────────────────────
    if (isRun) {
      let testCaseToRun;
      if (customInput) {
        testCaseToRun = { input: customInput, output: "N/A" };
      } else {
        testCaseToRun = problem.testCases.find(tc => tc.isHidden === false) || problem.testCases[0];
      }

      const runResult = executeLocally(code, langId, testCaseToRun.input, testCaseToRun.output, problem.timeLimit);
      return res.status(200).json({
        status: "success",
        data: {
          isRun: true,
          verdict: runResult.status,
          runtime: runResult.runtime,
          output: runResult.stdout // I need to return actual stdout from executeLocally
        }
      });
    }

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
// Internal: Local execution fallback (for when Judge0 API fails)
// ─────────────────────────────────────────────────────────────────────────────
function executeLocally(code, langId, input, expectedOutput, timeLimit) {
  const tempDir = path.join(process.cwd(), "temp_execution");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  
  const fileId = uuidv4();
  let filepath, command, args;
  
  if (langId === 71) { // python
    filepath = path.join(tempDir, `${fileId}.py`);
    fs.writeFileSync(filepath, code);
    command = "python";
    args = [filepath];
  } else if (langId === 63) { // javascript
    filepath = path.join(tempDir, `${fileId}.js`);
    fs.writeFileSync(filepath, code);
    command = "node";
    args = [filepath];
  } else {
    return { status: "COMPILE_ERROR", runtime: 0, memory: 0 }; // Local unsupported for cpp/java without compile steps
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
  
  if (expectedOutput !== "N/A") {
    const normalizedOut = out.replace(/\s+/g, '');
    const normalizedExpected = expectedOutput.trim().replace(/\s+/g, '');
    if (normalizedOut !== normalizedExpected) {
      return { status: "WRONG_ANSWER", runtime, memory: 0, stdout: out, stderr: errOut };
    }
  }
  
  return { status: "ACCEPTED", runtime, memory: 0, stdout: out, stderr: errOut };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: Judge0 execution pipeline
// ─────────────────────────────────────────────────────────────────────────────
async function judgeSubmission(submission, problem, code, langId, sessionId, contestId, behaviorLog) {
  const redis = getRedisClient();

  let finalVerdict = "ACCEPTED";
  let totalRuntime = 0;
  let totalMemory  = 0;

  const testCaseResults = [];
  try {
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
            "X-RapidAPI-Host": new URL(JUDGE0_URL).hostname,
            "Content-Type":    "application/json",
          },
          timeout: 10000,
        }
      );

      const r = response.data;
      totalRuntime += parseFloat(r.time || "0") * 1000;
      totalMemory  += r.memory || 0;

      const passed = r.status?.id === 3;
      testCaseResults.push({
        passed,
        input: tc.isHidden ? null : tc.input,
        output: tc.isHidden ? null : r.stdout,
        expected: tc.isHidden ? null : tc.output,
        status: r.status?.description
      });

      if (!passed) {
        const verdictMap = {
          4:  "WRONG_ANSWER",
          5:  "TIME_LIMIT_EXCEEDED",
          6:  "COMPILE_ERROR",
          11: "RUNTIME_ERROR",
          12: "MEMORY_LIMIT_EXCEEDED",
        };
        finalVerdict = verdictMap[r.status?.id] || "RUNTIME_ERROR";
        // Continue checking other test cases to show full results?
        // Usually, we stop at first failure for "Competitive Programming",
        // but for a better UI we can continue. Let's continue for now.
      }
    }
  } catch (err) {
    logger.warn(`Judge0 API failed (${err.message}). Falling back to FREE LOCAL EXECUTION...`);
    
    // Reset metrics for local fallback
    finalVerdict = "ACCEPTED";
    totalRuntime = 0;
    totalMemory = 0;
    testCaseResults.length = 0; // Clear partial Judge0 results

    for (const tc of problem.testCases) {
      const localResult = executeLocally(code, langId, tc.input, tc.output, problem.timeLimit);
      
      totalRuntime += localResult.runtime;
      totalMemory += localResult.memory;

      const passed = localResult.status === "ACCEPTED";
      testCaseResults.push({
        passed,
        input: tc.isHidden ? null : tc.input,
        output: tc.isHidden ? null : localResult.stdout,
        expected: tc.isHidden ? null : tc.output,
        status: localResult.status
      });

      if (!passed) {
        finalVerdict = localResult.status;
      }
    }
  }

  const count      = Math.max(problem.testCases.length, 1);
  const avgRuntime = Math.round(totalRuntime / count);
  const avgMemory  = Math.round(totalMemory  / count);

  // ── Update submission with judge result ────────────────────────────────────
  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data:  { 
      verdict: finalVerdict, 
      runtime: avgRuntime, 
      memory: avgMemory,
      testCaseResults: testCaseResults
    },
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
    // ── 2. Run AI Analysis (Python service handles DB persistence) ──────────
    const { data } = await axios.post(`${DETECTION_URL}/detect/analyze`, {
      submissionId: submission.id,
      userId:       submission.userId,
      code:         submission.code,
      language:     submission.language,
      behaviorLog:  behaviorLog || [],
    });

    const report = data; 

    // ── 3. Invalidate user cache and emit real-time result ──────────────────
    const redis = getRedisClient();
    await redis.del(`cache:user:${submission.userId}`);

    await redis.publish(
      "realtime:events",
      JSON.stringify({
        room: `user:${submission.userId}`,
        event: "submission:detection",
        data: {
          submissionId:    submission.id,
          aiScore:         report.finalAiScore,
          aiVerdict:       report.aiVerdict,
          flags:           report.flags,
          trustScoreDelta: report.trustScoreDelta
        }
      })
    );

    logger.info(`AI Analysis complete for ${submission.id}: score=${report.finalAiScore} verdict=${report.aiVerdict}`);
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
        user: { select: { trustScore: true } },
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
