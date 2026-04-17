/**
 * JWT helpers — issue & verify access + refresh tokens
 */
const jwt = require("jsonwebtoken");

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || "changeme_access";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "changeme_refresh";
const ACCESS_EXP     = process.env.JWT_ACCESS_EXPIRES_IN  || "15m";
const REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXP });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
