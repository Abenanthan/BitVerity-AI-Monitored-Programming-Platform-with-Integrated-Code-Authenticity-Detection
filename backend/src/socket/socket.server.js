const { Server } = require("socket.io");
const { getRedisClient } = require("../lib/redis");
const prisma = require("../lib/prisma");
const { verifyAccessToken } = require("../utils/jwt");
const logger = require("../utils/logger");

/**
 * initSocket — attaches Socket.io to the HTTP server.
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // ── JWT auth middleware for Socket.io ────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ── Redis subscriber for real-time pushes ─────────────────────────────────
  const subscriber = getRedisClient().duplicate();

  subscriber.subscribe("realtime:events", (err) => {
    if (err) logger.error("Redis subscribe error:", err);
  });

  subscriber.on("message", (channel, message) => {
    if (channel !== "realtime:events") return;
    try {
      const { room, event, data } = JSON.parse(message);
      if (room && event) {
        io.to(room).emit(event, data);
      }
    } catch (err) {
      logger.error("Failed to parse realtime event:", err);
    }
  });

  // ── Connection handling ───────────────────────────────────────────────────
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} user:${socket.user?.sub}`);

    socket.on("join:user", ({ userId }) => {
      // Ensure users can only join their own room
      if (socket.user && socket.user.sub === userId) {
        socket.join(`user:${userId}`);
        logger.debug(`${socket.id} joined user room: ${userId}`);
      }
    });

    socket.on("join:contest", async ({ contestId }) => {
      socket.join(`contest:${contestId}`);
      logger.debug(`${socket.id} joined contest room: ${contestId}`);

      try {
        const contest = await prisma.contest.findUnique({
          where: { id: contestId },
          select: { endTime: true }
        });

        if (contest) {
          socket.emit("contest:timer:sync", {
            contestId,
            endsAt: contest.endTime,
            serverTime: Date.now()
          });
        }
      } catch (err) {
        logger.error("Error fetching contest ending time:", err);
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  return io;
}

module.exports = { initSocket };
