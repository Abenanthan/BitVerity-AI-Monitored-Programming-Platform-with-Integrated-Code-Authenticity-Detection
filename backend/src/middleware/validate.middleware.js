const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

/**
 * validate — run after express-validator chains.
 * Collects all validation errors and sends a 422 response.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`).join("; ");
    return next(new AppError(messages, 422, "VALIDATION_ERROR"));
  }
  next();
}

module.exports = { validate };
