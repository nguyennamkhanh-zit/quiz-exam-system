const { pool } = require("../config/database");

/**
 * Ghi vết nhật ký hoạt động (Audit Log)
 * Không bao giờ ghi mật khẩu, token, cookie, URL chứa token hoặc dữ liệu bí mật
 */
async function logAudit({
  userId = null,
  username = null,
  role = null,
  action,
  entityType,
  entityId = null,
  details = null,
  status = "success",
  req = null,
}) {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.ip || req.connection?.remoteAddress || null;
      userAgent = (req.headers && req.headers["user-agent"]) ? String(req.headers["user-agent"]).substring(0, 255) : null;
      if (!userId && req.user) {
        userId = req.user.id || null;
        username = req.user.username || null;
        role = req.user.role || null;
      }
    }

    let detailsStr = null;
    if (details) {
      if (typeof details === "object") {
        // Lọc bỏ các trường nhạy cảm nếu có
        const sanitized = { ...details };
        delete sanitized.password;
        delete sanitized.password_hash;
        delete sanitized.token;
        delete sanitized.rawToken;
        delete sanitized.secret;
        delete sanitized.cookie;
        detailsStr = JSON.stringify(sanitized);
      } else {
        detailsStr = String(details);
      }
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, username, role, action, entity_type, entity_id, details, status, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, role, action, entityType, entityId ? String(entityId) : null, detailsStr, status, ipAddress, userAgent]
    );
  } catch (err) {
    // Không làm sập luồng chính nếu lỗi ghi audit
    console.error("[AUDIT_LOG_ERROR]", err.message);
  }
}

module.exports = {
  logAudit,
};

