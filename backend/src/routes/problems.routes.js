const { Router } = require("express");
const { body }   = require("express-validator");
const { listProblems, getProblem, createProblem } = require("../controllers/problems.controller");
const { authenticate, optionalAuth } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

const router = Router();

// GET  /api/problems
router.get("/", optionalAuth, listProblems);

// GET  /api/problems/:slug
router.get("/:slug", optionalAuth, getProblem);

// POST /api/problems  (admin only — add role guard later)
router.post(
  "/",
  authenticate,
  [
    body("title").notEmpty().isLength({ max: 255 }),
    body("slug").notEmpty().matches(/^[a-z0-9-]+$/),
    body("description").notEmpty(),
    body("difficulty").isIn(["EASY", "MEDIUM", "HARD"]),
    body("timeLimit").isInt({ min: 100 }),
    body("memoryLimit").isInt({ min: 16 }),
  ],
  validate,
  createProblem
);

module.exports = router;
