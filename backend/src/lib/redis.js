const Redis = require("ioredis");
const logger = require("../utils/logger");

let redisClient;
let _warnedDown = false;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 1,   // fail fast — don't block the app
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        // Stop retrying after 3 attempts; log only the first failure
        if (times > 3) return null; // stop retrying
        return Math.min(times * 500, 2000);
      },
    });

    redisClient.on("connect",  () => {
      _warnedDown = false;
      logger.info("✅  Redis connected");
    });
    redisClient.on("error", () => {
      if (!_warnedDown) {
        _warnedDown = true;
        logger.warn("⚠️  Redis unavailable — running without cache/pub-sub (WebSocket events use direct emit)");
      }
    });
    redisClient.on("close", () => {});  // suppress close noise
  }
  return redisClient;
}

module.exports = { getRedisClient };
