const prisma   = require("../lib/prisma");
const AppError = require("../utils/AppError");
const logger   = require("../utils/logger");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/detection/report/:submissionId
// Returns full detection report for a submission.
// Only the submission owner can view their own report.
// ─────────────────────────────────────────────────────────────────────────────
async function getReport(req, res, next) {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where:   { id: submissionId },
      include: { detectionReport: true },
    });

    if (!submission)
      return next(new AppError("Submission not found", 404, "NOT_FOUND"));

    if (submission.userId !== req.user.id)
      return next(new AppError("Access denied", 403, "FORBIDDEN"));

    if (!submission.detectionReport)
      return next(new AppError("Detection report not yet available", 202, "PENDING"));

    res.json({ success: true, data: submission.detectionReport });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/detection/explain
//
// Scores an explainability challenge answer.
// After detection flags a submission as SUSPICIOUS / AI_GENERATED, the platform
// can ask the user to explain their code. This endpoint scores the answer and
// updates the explainability score on the detection report.
//
// Body: { submissionId, answer, questionId }
// ─────────────────────────────────────────────────────────────────────────────
async function scoreExplainability(req, res, next) {
  try {
    const { submissionId, answer, questionId } = req.body;
    const userId = req.user.id;

    if (!submissionId || !answer)
      return next(new AppError("submissionId and answer are required", 400, "BAD_REQUEST"));

    const submission = await prisma.submission.findUnique({
      where:   { id: submissionId },
      include: { detectionReport: true },
    });

    if (!submission)
      return next(new AppError("Submission not found", 404, "NOT_FOUND"));

    if (submission.userId !== userId)
      return next(new AppError("Access denied", 403, "FORBIDDEN"));

    if (!submission.detectionReport)
      return next(new AppError("No detection report found for this submission", 404, "NOT_FOUND"));

    // ── Score the answer ───────────────────────────────────────────────────────
    // Simple keyword-overlap scoring against the submission's own code.
    // A real system would use an LLM or curated rubric.
    const codeTokens  = new Set(
      submission.code.toLowerCase().match(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g) || []
    );
    const answerTokens = (answer.toLowerCase().match(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g) || []);
    const overlap      = answerTokens.filter((t) => codeTokens.has(t)).length;
    const rawScore     = Math.min(overlap / Math.max(codeTokens.size * 0.3, 1), 1.0);

    // Weighted score: longer, more specific answers score higher
    const lengthBonus  = Math.min(answer.split(/\s+/).length / 50, 0.2);
    const explainScore = Math.min(rawScore + lengthBonus, 1.0);

    // ── Update the report ──────────────────────────────────────────────────────
    // Recalculate finalAiScore with the new explainability score (weight 10%)
    const report = submission.detectionReport;
    const newFinalScore = parseFloat((
      0.30 * report.behavioralScore     +
      0.35 * report.codePatternScore    +
      0.25 * report.fingerprintScore    +
      0.10 * (1.0 - explainScore)       // higher explainability → lower AI score
    ).toFixed(4));

    const newFlags = Array.isArray(report.flags) ? report.flags : [];

    // Append explainability challenge result as a flag
    newFlags.push({
      type:        "EXPLAINABILITY_CHALLENGE",
      severity:    explainScore > 0.6 ? "low" : "high",
      description: `Explainability challenge scored ${(explainScore * 100).toFixed(0)}% — question: ${questionId || "general"}`,
      evidence:    `answer_tokens=${answerTokens.length}, overlap=${overlap}`,
    });

    const updatedReport = await prisma.detectionReport.update({
      where: { id: report.id },
      data: {
        explainabilityScore: parseFloat(explainScore.toFixed(4)),
        finalAiScore:        newFinalScore,
        flags:               newFlags,
      },
    });

    // Adjust trust score delta based on improved response
    const trustAdjust = parseFloat((explainScore * 5).toFixed(2)); // up to +5
    await prisma.user.update({
      where: { id: userId },
      data:  { trustScore: { increment: trustAdjust } },
    });

    logger.info(
      `Explainability scored: submission=${submissionId} score=${explainScore.toFixed(3)} trustAdj=+${trustAdjust}`
    );

    res.json({
      success: true,
      data: {
        explainabilityScore: updatedReport.explainabilityScore,
        finalAiScore:        updatedReport.finalAiScore,
        trustScoreAdjustment: trustAdjust,
        message: explainScore > 0.6
          ? "Good explanation — trust score improved"
          : "Explanation insufficient — consider providing more detail",
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReport, scoreExplainability };
