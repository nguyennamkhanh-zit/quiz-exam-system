const { verifyToken } = require("../utils/jwt");
const { parseCookies } = require("../utils/helpers");
const { pool } = require("../config/database");

async function authenticate(req, res, next) {
  // Lấy token từ HttpOnly Cookie hoặc Authorization Header (Bearer)
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies.auth_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Phiên làm việc không hợp lệ.",
    });
  }

  // Kiểm tra token_version để thu hồi token ngay khi user đã logout
  try {
    const [rows] = await pool.query(
      "SELECT id, token_version FROM users WHERE id = ? LIMIT 1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại trên hệ thống.",
      });
    }

    const currentVersion = rows[0].token_version || 1;
    const tokenVersion = decoded.token_version || 1;

    if (tokenVersion !== currentVersion) {
      return res.status(401).json({
        success: false,
        message: "Phiên làm việc đã bị thu hồi (đã đăng xuất). Vui lòng đăng nhập lại.",
      });
    }
  } catch (dbErr) {
    console.error("[AUTH_TOKEN_VERSION_CHECK_ERROR]", dbErr.message);
  }

  req.user = decoded;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập." });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập chức năng này.",
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};
