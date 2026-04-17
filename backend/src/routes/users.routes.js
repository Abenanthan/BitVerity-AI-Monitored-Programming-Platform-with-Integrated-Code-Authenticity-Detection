const { Router } = require("express");
const { body }   = require("express-validator");

const { getMe, getProfile, getUserSubmissions, updateMe, leaderboard } =
  require("../controllers/users.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate }     = require("../middleware/validate.middleware");

const router = Router();

// GET  /api/users/leaderboard
router.get("/leaderboard", leaderboard);

// GET  /api/users/me  (auth required — Redis cached)
router.get("/me", authenticate, getMe);

// PATCH /api/users/me
router.patch(
  "/me",
  authenticate,
  [body("avatarUrl").optional().isURL()],
  validate,
  updateMe
);

// GET  /api/users/:username  (public)
router.get("/:username", getProfile);

// GET  /api/users/:username/submissions
router.get("/:username/submissions", authenticate, getUserSubmissions);

module.exports = router;
