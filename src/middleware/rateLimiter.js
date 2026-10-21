// Rate limiter in-memory cho login/register chống brute-force
const attempts = new Map();

function authRateLimiter(options = { windowMs: 15 * 60 * 1000, max: 20 }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    const entry = attempts.get(ip) || { count: 0, resetTime: now + options.windowMs };

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + options.windowMs;
    } else {
      entry.count += 1;
    }

    attempts.set(ip, entry);

    if (entry.count > options.max) {
      return res.status(429).json({
        success: false,
        message: "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau vài phút.",
      });
    }

    next();
  };
}

module.exports = { authRateLimiter };
