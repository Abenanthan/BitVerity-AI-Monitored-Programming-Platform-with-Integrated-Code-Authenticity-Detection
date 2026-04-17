/**
 * middleware/rateLimit.middleware.js
 *
 * Per-user submission rate limiter using Redis INCR.
 * Max 5 submissions per 60-second window per user.
 *
 * Key:   ratelimit:{userId}:submit
 * Value: submission count (integer)
 * TTL:   60 seconds (sliding window resets on first request)
 */
const { getRedisClient } = require("../lib/redis");
const AppError = require("../utils/AppError");

const SUBMISSION_LIMIT  = parseInt(process.env.SUBMIT_RATE_LIMIT  || "5",  10);
const SUBMISSION_WINDOW = parseInt(process.env.SUBMIT_RATE_WINDOW || "60", 10); // seconds

async function submissionRateLimit(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return next(); // unauthenticated — let auth middleware handle it

    const redis = getRedisClient();
    const key   = `ratelimit:${userId}:submit`;

    // Atomic increment
    const count = await redis.incr(key);

    // Set TTL only on the first request in the window
    if (count === 1) {
      await redis.expire(key, SUBMISSION_WINDOW);
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit",     SUBMISSION_LIMIT);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, SUBMISSION_LIMIT - count));

    if (count > SUBMISSION_LIMIT) {
      const ttl = await redis.ttl(key);
      res.setHeader("Retry-After", ttl);
      return next(
        new AppError(
          `Submission rate limit exceeded. Max ${SUBMISSION_LIMIT} per ${SUBMISSION_WINDOW}s. Retry in ${ttl}s.`,
          429,
          "RATE_LIMIT_EXCEEDED"
        )
      );
    }

    next();
  } catch (err) {
    // If Redis fails, allow the request (fail open)
    next();
  }
}

module.exports = { submissionRateLimit };
