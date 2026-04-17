const { Router } = require("express");
const { body }   = require("express-validator");

const {
  listContests, getContest, createContest,
  registerForContest, contestLeaderboard,
} = require("../controllers/contests.controller");
const { authenticate, optionalAuth } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const router = Router();

// GET  /api/contests
router.get("/", optionalAuth, listContests);

// GET  /api/contests/:id
router.get("/:id", optionalAuth, getContest);

// GET  /api/contests/:id/leaderboard  (Redis sorted set → ZREVRANGE)
router.get("/:id/leaderboard", contestLeaderboard);

// POST /api/contests/:id/join
router.post("/:id/join", authenticate, registerForContest);

// POST /api/contests/:id/register  (alias)
router.post("/:id/register", authenticate, registerForContest);

// POST /api/contests
router.post(
  "/",
  authenticate,
  [
    body("title").notEmpty().isLength({ max: 255 }),
    body("description").notEmpty(),
    body("startTime").isISO8601(),
    body("endTime").isISO8601(),
    body("problemIds").optional().isArray(),
  ],
  validate,
  createContest
);

module.exports = router;
