const { parseCookies, generateCsrfToken } = require("../utils/helpers");

function csrfProtection(req, res, next) {
  // Bỏ qua với phương thức an toàn (GET, HEAD, OPTIONS)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Đọc csrf token từ cookie và từ header x-csrf-token hoặc body _csrf
  const cookies = parseCookies(req.headers.cookie);
  const cookieCsrf = cookies["csrf_token"];
  const headerCsrf = req.headers["x-csrf-token"] || (req.body && req.body._csrf);

  // Nếu người dùng có cookie auth nhưng không gửi hoặc sai csrf_token
  if (cookies.auth_token) {
    if (!cookieCsrf || !headerCsrf || cookieCsrf !== headerCsrf) {
      return res.status(403).json({
        success: false,
        message: "Phiên bảo mật CSRF không hợp lệ hoặc đã hết hạn.",
      });
    }
  }

  next();
}

function issueCsrfCookie(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies["csrf_token"]) {
    const token = generateCsrfToken();
    res.cookie("csrf_token", token, {
      httpOnly: false, // Phải để JS đọc được và gán vào header x-csrf-token
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  next();
}

module.exports = {
  csrfProtection,
  issueCsrfCookie,
};
