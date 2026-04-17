const { Router } = require("express");
const { body }   = require("express-validator");

const { register, login, refresh, logout, me } = require("../controllers/auth.controller");
const { githubRedirect, githubCallback }       = require("../controllers/github.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate }     = require("../middleware/validate.middleware");

const router = Router();

// ── Credentials ───────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("username").isAlphanumeric().isLength({ min: 3, max: 30 }),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  validate,
  login
);

// POST /api/auth/refresh
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", authenticate, logout);

// GET  /api/auth/me
router.get("/me", authenticate, me);

// ── GitHub OAuth ───────────────────────────────────────────────────────────────
// GET /api/auth/github
router.get("/github", githubRedirect);

// GET /api/auth/github/callback
router.get("/github/callback", githubCallback);

module.exports = router;
