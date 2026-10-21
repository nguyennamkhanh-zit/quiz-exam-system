const crypto = require("crypto");

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(";");
  for (const item of items) {
    const parts = item.split("=");
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    if (key) {
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

// Chuyển đổi timestamp MySQL (UTC hoặc string) sang chuẩn ISO 8601 UTC có hậu tố Z
function toIsoUtcString(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return dateVal.toISOString();
  }
  const str = String(dateVal).trim();
  if (str.endsWith("Z")) {
    return str;
  }
  // Nếu là dạng 'YYYY-MM-DD HH:mm:ss'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    return str.replace(" ", "T") + "Z";
  }
  return new Date(str).toISOString();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = {
  generateCsrfToken,
  parseCookies,
  toIsoUtcString,
  hashToken,
  generateRandomToken,
};

