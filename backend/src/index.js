require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const logger = require("./utils/logger");
const prisma = require("./lib/prisma");
const { getRedisClient } = require("./lib/redis");
const { initSocket } = require("./socket/socket.server");
const { errorHandler } = require("./middleware/error.middleware");

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const problemsRoutes = require("./routes/problems.routes");
const submissionsRoutes = require("./routes/submissions.routes");
const contestsRoutes = require("./routes/contests.routes");
const detectionRoutes = require("./routes/detection.routes");
const explainRoutes = require("./routes/explain.routes");

// ──────────────────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Global rate limiter (100 req / 15 min per IP) ────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: "RATE_LIMITED", message: "Too many requests" },
  })
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redis = getRedisClient();
    await redis.ping();
    res.json({ status: "ok", db: "connected", redis: "connected", at: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "degraded", error: err.message });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/problems", problemsRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/contests", contestsRoutes);
app.use("/api/detection", detectionRoutes);
app.use("/api/explain", explainRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, code: "NOT_FOUND", message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────────────────────────────────
initSocket(server);

// ── Start ─────────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("✅  PostgreSQL connected via Prisma");

    getRedisClient(); // initialise + log connection

    server.listen(PORT, () => {
      logger.info(`🚀  CodeVerify API running on http://localhost:${PORT}`);
      logger.info(`🔌  Socket.io ready`);
      logger.info(`🌱  Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    logger.error("❌  Bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received — shutting down gracefully …");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
