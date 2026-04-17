const bcrypt = require("bcryptjs");
const prisma  = require("../lib/prisma");
const { getRedisClient } = require("../lib/redis");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

// ── Register ──────────────────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) {
      return next(
        exists.email === email
          ? new AppError("Email already in use", 409, "EMAIL_TAKEN")
          : new AppError("Username already taken", 409, "USERNAME_TAKEN")
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
      select: { id: true, email: true, username: true, trustScore: true, createdAt: true },
    });

    const accessToken  = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const refreshToken = signRefreshToken({ sub: user.id });

    // Store refresh token in Redis (TTL = 7 days)
    const redis = getRedisClient();
    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 60 * 60 * 24 * 7);

    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS"));

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)  return next(new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS"));

    const accessToken  = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const refreshToken = signRefreshToken({ sub: user.id });

    const redis = getRedisClient();
    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 60 * 60 * 24 * 7);

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
}

// ── Refresh Token ─────────────────────────────────────────────────────────────
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError("Refresh token required", 400, "BAD_REQUEST"));

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return next(new AppError("Invalid or expired refresh token", 401, "TOKEN_INVALID"));
    }

    const redis = getRedisClient();
    const stored = await redis.get(`refresh:${decoded.sub}`);
    if (stored !== refreshToken) {
      return next(new AppError("Refresh token reuse detected", 401, "TOKEN_REUSE"));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, username: true },
    });
    if (!user) return next(new AppError("User not found", 404, "NOT_FOUND"));

    const newAccessToken  = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const newRefreshToken = signRefreshToken({ sub: user.id });

    await redis.set(`refresh:${user.id}`, newRefreshToken, "EX", 60 * 60 * 24 * 7);

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    next(err);
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    const redis = getRedisClient();
    await redis.del(`refresh:${req.user.id}`);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

// ── Me ────────────────────────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, username: true, avatarUrl: true,
        trustScore: true, totalSolved: true, createdAt: true,
      },
    });
    if (!user) return next(new AppError("User not found", 404, "NOT_FOUND"));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
