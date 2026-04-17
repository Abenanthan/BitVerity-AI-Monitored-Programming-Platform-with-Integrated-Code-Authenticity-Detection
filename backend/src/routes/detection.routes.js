const { Router } = require("express");
const { body }   = require("express-validator");

const { getReport, scoreExplainability } = require("../controllers/detection.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate }     = require("../middleware/validate.middleware");

const router = Router();

// All detection routes require authentication
router.use(authenticate);

// GET  /api/detection/report/:submissionId
// → Full detection report for a submission (owner only)
router.get("/report/:submissionId", getReport);

// POST /api/detection/explain
// → Score a user's explanation of their suspicious code
// → Updates explainability score + trust score delta
router.post(
  "/explain",
  [
    body("submissionId").isUUID(),
    body("answer").notEmpty().isLength({ min: 20, max: 5000 }),
    body("questionId").optional().isString(),
  ],
  validate,
  scoreExplainability
);

module.exports = router;
