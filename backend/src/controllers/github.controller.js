const axios    = require("axios");
const prisma   = require("../lib/prisma");
const { getRedisClient } = require("../lib/redis");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");
const logger   = require("../utils/logger");

const GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID     || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL  || "http://localhost:5000/api/auth/github/callback";
const FRONTEND_URL         = process.env.FRONTEND_URL         || "http://localhost:5173";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/github
// Redirect user to GitHub OAuth consent screen
// ─────────────────────────────────────────────────────────────────────────────
function githubRedirect(req, res) {
  const params = new URLSearchParams({
    client_id:    GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope:        "read:user user:email",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/github/callback
// Exchange code → token → GitHub user → upsert DB user → return JWT tokens
// ─────────────────────────────────────────────────────────────────────────────
async function githubCallback(req, res, next) {
  const { code } = req.query;
  if (!code) return next(new AppError("GitHub OAuth code missing", 400, "BAD_REQUEST"));

  try {
    // ── 1. Exchange code for GitHub access token ──────────────────────────────
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id:     GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: "application/json" } }
    );

    const githubAccessToken = tokenRes.data.access_token;
    if (!githubAccessToken) {
      logger.error("GitHub token exchange failed:", tokenRes.data);
      return next(new AppError("GitHub authentication failed", 502, "GITHUB_AUTH_FAILED"));
    }

    // ── 2. Fetch GitHub user profile ──────────────────────────────────────────
    const [profileRes, emailsRes] = await Promise.all([
      axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      }),
      axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${githubAccessToken}` },
      }),
    ]);

    const ghUser   = profileRes.data;
    const ghEmails = emailsRes.data;

    const primaryEmail =
      ghEmails.find((e) => e.primary && e.verified)?.email ||
      ghUser.email ||
      `${ghUser.login}@github.local`;

    const githubId = String(ghUser.id);

    // ── 3. Upsert user in PostgreSQL ──────────────────────────────────────────
    let user = await prisma.user.findFirst({
      where: { OR: [{ githubId }, { email: primaryEmail }] },
    });

    if (user) {
      // Link GitHub ID to existing email account if not already linked
      if (!user.githubId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data:  { githubId, avatarUrl: user.avatarUrl || ghUser.avatar_url },
        });
      }
    } else {
      // New user via GitHub
      const baseUsername = ghUser.login.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30);
      let username = baseUsername;
      let suffix   = 1;

      // Ensure unique username
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix++}`;
      }

      user = await prisma.user.create({
        data: {
          email:        primaryEmail,
          username,
          passwordHash: "", // no password for OAuth users
          githubId,
          avatarUrl:    ghUser.avatar_url,
        },
      });
    }

    // ── 4. Issue JWT tokens ───────────────────────────────────────────────────
    const accessToken  = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const refreshToken = signRefreshToken({ sub: user.id });

    const redis = getRedisClient();
    await redis.set(`refresh:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    // ── 5. Redirect front-end with tokens in query params ─────────────────────
    // The frontend should extract them and store in memory / httpOnly cookie.
    const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set("accessToken",  accessToken);
    redirectUrl.searchParams.set("refreshToken", refreshToken);

    res.redirect(redirectUrl.toString());
  } catch (err) {
    logger.error("GitHub OAuth error:", err.message);
    next(new AppError("GitHub authentication error", 502, "GITHUB_AUTH_FAILED"));
  }
}

module.exports = { githubRedirect, githubCallback };
