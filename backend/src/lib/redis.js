const Redis = require("ioredis");
const logger = require("../utils/logger");

let redisClient;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    redisClient.on("connect",  () => logger.info("✅  Redis connected"));
    redisClient.on("error",   (err) => logger.error("Redis error:", err));
    redisClient.on("close",   () => logger.warn("Redis connection closed"));
  }
  return redisClient;
}

module.exports = { getRedisClient };
