const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "quiz-system-dev-jwt-secret-do-not-use-in-production-123456789";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
