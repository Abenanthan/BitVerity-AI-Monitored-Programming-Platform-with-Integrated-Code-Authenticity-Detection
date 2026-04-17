const { Router } = require("express");
const { body }   = require("express-validator");

const { createSubmission, getSubmission, listSubmissions } =
  require("../controllers/submissions.controller");
const { authenticate }        = require("../middleware/auth.middleware");
const { validate }            = require("../middleware/validate.middleware");
const { submissionRateLimit } = require("../middleware/rateLimit.middleware");

const router = Router();

// All submission routes require authentication
router.use(authenticate);

// GET  /api/submissions/my  (alias — same as GET /)
router.get("/my", listSubmissions);

// GET  /api/submissions
router.get("/", listSubmissions);

// GET  /api/submissions/:id
router.get("/:id", getSubmission);

// POST /api/submissions
// → Per-user rate limit (5/min via Redis INCR) before handler
router.post(
  "/",
  submissionRateLimit,
  [
    body("problemId").isUUID(),
    body("contestId").optional().isUUID(),
    body("code").notEmpty().isLength({ max: 65535 }),
    body("language").isIn(["python", "java", "cpp", "javascript"]),
    body("behaviorLog").optional().isArray(),
  ],
  validate,
  createSubmission
);

module.exports = router;
