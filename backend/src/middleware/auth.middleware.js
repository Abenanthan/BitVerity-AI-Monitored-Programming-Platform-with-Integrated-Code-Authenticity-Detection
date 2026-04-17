const { verifyAccessToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

/**
 * authenticate — verifies the Bearer token and attaches decoded user to req.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Missing or malformed authorization header", 401, "UNAUTHORIZED"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, email: decoded.email, username: decoded.username };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Access token expired", 401, "TOKEN_EXPIRED"));
    }
    return next(new AppError("Invalid access token", 401, "TOKEN_INVALID"));
  }
}

/**
 * optionalAuth — same as authenticate but does not fail if no token is present.
 * Useful for public endpoints that show extra info when logged in.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }
  authenticate(req, res, next);
}

module.exports = { authenticate, optionalAuth };
