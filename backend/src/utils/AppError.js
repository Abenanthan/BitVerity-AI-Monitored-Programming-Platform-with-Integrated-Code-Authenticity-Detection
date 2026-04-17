/**
 * AppError — structured operational error class.
 * Pass these to next() and the global handler will format them.
 */
class AppError extends Error {
  /**
   * @param {string} message  Human-readable message
   * @param {number} status   HTTP status code (default 500)
   * @param {string} code     Machine-readable error code (optional)
   */
  constructor(message, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.name       = "AppError";
    this.status     = status;
    this.code       = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
