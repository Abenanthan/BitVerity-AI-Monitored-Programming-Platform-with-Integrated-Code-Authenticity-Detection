const logger = require("../utils/logger");

/**
 * Global error handler — must be registered LAST in Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status  = err.status  || 500;
  const code    = err.code    || "INTERNAL_ERROR";
  const message = err.isOperational ? err.message : "An unexpected error occurred";

  if (status >= 500) {
    logger.error({ message: err.message, stack: err.stack, code, url: req.originalUrl });
  }

  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
