const bcrypt = require("bcryptjs");
const { pool } = require("../config/database");
const { generateToken } = require("../utils/jwt");
const { generateCsrfToken, hashToken, generateRandomToken } = require("../utils/helpers");
const { mailer } = require("../services/mailService");

async function register(req, res) {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin (tên đăng nhập, email, mật khẩu, họ tên).",
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Tên đăng nhập phải từ 3 đến 30 ký tự.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ email không hợp lệ.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có độ dài tối thiểu 6 ký tự.",
      });
    }

    // Kiểm tra trùng username hoặc email
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Tên đăng nhập hoặc email đã tồn tại trên hệ thống.",
      });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Mặc định đăng ký luôn là 'student', không bao giờ tin cậy role gửi lên từ client
    const role = "student";

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, passwordHash, full_name, role]
    );

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thí sinh thành công. Bạn có thể đăng nhập ngay.",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("[AUTH_REGISTER_ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi đăng ký tài khoản.",
    });
  }
}

async function login(req, res) {
  try {
    const { login, password } = req.body; // login có thể là username hoặc email

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên đăng nhập/email và mật khẩu.",
      });
    }

    const [users] = await pool.query(
      "SELECT id, username, email, password_hash, full_name, role, token_version FROM users WHERE username = ? OR email = ? LIMIT 1",
      [login, login]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không chính xác.",
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không chính xác.",
      });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      token_version: user.token_version || 1,
    };

    const token = generateToken(tokenPayload);
    const csrfToken = generateCsrfToken();

    const isProd = process.env.NODE_ENV === "production";

    // Set cookie HttpOnly
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "Lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 tiếng
      path: "/",
    });

    // Set cookie CSRF (cho phép frontend đọc để gửi header)
    res.cookie("csrf_token", csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: "Lax",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      csrfToken,
    });
  } catch (error) {
    console.error("[AUTH_LOGIN_ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi đăng nhập.",
    });
  }
}

async function logout(req, res) {
  try {
    if (req.user && req.user.id) {
      await pool.query("UPDATE users SET token_version = token_version + 1 WHERE id = ?", [req.user.id]);
    }
  } catch (err) {
    console.error("[AUTH_LOGOUT_REVOKE_ERROR]", err.message);
  }

  res.clearCookie("auth_token", { path: "/" });
  res.clearCookie("csrf_token", { path: "/" });
  return res.status(200).json({
    success: true,
    message: "Đăng xuất thành công. Phiên làm việc đã bị thu hồi.",
  });
}

async function getCurrentUser(req, res) {
  // req.user được gán từ middleware authenticate
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

// Yêu cầu liên kết đặt lại mật khẩu qua email
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập địa chỉ email hợp lệ.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ email không đúng định dạng.",
      });
    }

    // Luôn trả thông báo chung để hạn chế dò email (Account Enumeration)
    const genericResponse = {
      success: true,
      message: "Nếu địa chỉ email đã được đăng ký, chúng tôi đã gửi liên kết đặt lại mật khẩu đến hộp thư của bạn.",
    };

    const [users] = await pool.query(
      "SELECT id, username, email, full_name FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(200).json(genericResponse);
    }

    const user = users[0];

    // Sinh token ngẫu nhiên bằng crypto và hash SHA-256 để lưu DB
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    // Thời hạn 15 phút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Vô hiệu hóa các token reset cũ của người dùng này trước khi tạo token mới
    await pool.query(
      "UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [user.id]
    );

    // Lưu token_hash vào bảng password_resets
    await pool.query(
      "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [user.id, tokenHash, expiresAt]
    );

    // Sử dụng PUBLIC_BASE_URL được cấu hình, không lấy tùy ý từ Host header
    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:18098";
    const resetUrl = `${baseUrl}/#reset-password/${rawToken}`;

    // Gửi email qua SMTP
    const mailText = [
      `Xin chào ${user.full_name || user.username},`,
      "",
      "Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản trên Hệ thống Thi Trắc Nghiệm (QuizExam).",
      "",
      `Vui lòng truy cập liên kết sau để đặt mật khẩu mới (liên kết có hiệu lực trong 15 phút):`,
      resetUrl,
      "",
      "Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email và mật khẩu của bạn sẽ không bị thay đổi.",
      "",
      "Trân trọng,",
      "Hệ thống QuizExam System"
    ].join("\n");

    const mailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a;">Đặt Lại Mật Khẩu - QuizExam System</h2>
        <p>Xin chào <strong>${user.full_name || user.username}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Đặt Lại Mật Khẩu Mới
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b;">Hoặc sao chép liên kết sau vào trình duyệt:<br>
          <a href="${resetUrl}" style="word-break: break-all; color: #2563eb;">${resetUrl}</a>
        </p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          * Liên kết này chỉ có hiệu lực trong vòng <strong>15 phút</strong> và chỉ sử dụng được <strong>một lần</strong>.<br>
          * Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể yên tâm bỏ qua email này.
        </p>
      </div>
    `;

    try {
      await mailer.sendMail({
        to: user.email,
        subject: "[QuizExam] Hướng dẫn đặt lại mật khẩu tài khoản",
        text: mailText,
        html: mailHtml,
      });
    } catch (mailErr) {
      console.error("[MAIL_SEND_ERROR] Lỗi gửi email reset password:", mailErr.message);
      // Vẫn trả về genericResponse để an toàn thông tin
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("[AUTH_FORGOT_PASSWORD_ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi xử lý yêu cầu đặt lại mật khẩu.",
    });
  }
}

// Xác thực token đặt lại mật khẩu (GET mở link không tiêu thụ token)
async function verifyResetToken(req, res) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Token đặt lại mật khẩu không hợp lệ.",
      });
    }

    const tokenHash = hashToken(token.trim());
    const [rows] = await pool.query(
      "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ? LIMIT 1",
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Liên kết đặt lại mật khẩu không tồn tại hoặc đã bị vô hiệu hóa.",
      });
    }

    const resetRow = rows[0];
    if (resetRow.used_at !== null) {
      return res.status(400).json({
        success: false,
        message: "Liên kết đặt lại mật khẩu này đã được sử dụng.",
      });
    }

    if (new Date() > new Date(resetRow.expires_at)) {
      return res.status(400).json({
        success: false,
        message: "Liên kết đặt lại mật khẩu đã hết hạn (quá 15 phút). Vui lòng yêu cầu lại.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token hợp lệ.",
    });
  } catch (error) {
    console.error("[AUTH_VERIFY_TOKEN_ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi kiểm tra token.",
    });
  }
}

// Thực hiện đặt lại mật khẩu mới (POST duy nhất tiêu thụ token)
async function resetPassword(req, res) {
  let connection;
  try {
    const { token, new_password, confirm_password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã xác nhận đặt lại mật khẩu.",
      });
    }

    if (!new_password || typeof new_password !== "string" || new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu xác nhận không khớp với mật khẩu mới.",
      });
    }

    const tokenHash = hashToken(token.trim());

    // Khởi tạo Transaction với khóa dòng FOR UPDATE để xử lý đồng thời (chống race-condition)
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ? FOR UPDATE",
      [tokenHash]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc không tồn tại.",
      });
    }

    const resetRow = rows[0];

    if (resetRow.used_at !== null) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Liên kết đặt lại mật khẩu này đã được sử dụng.",
      });
    }

    if (new Date() > new Date(resetRow.expires_at)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu liên kết mới.",
      });
    }

    // Đánh dấu token đã sử dụng ngay lập tức
    await connection.query(
      "UPDATE password_resets SET used_at = NOW() WHERE id = ?",
      [resetRow.id]
    );

    // Hash mật khẩu mới bằng Bcrypt
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    // Cập nhật mật khẩu và TĂNG token_version để thu hồi toàn bộ các phiên đăng nhập cũ
    await connection.query(
      "UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?",
      [newHash, resetRow.user_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Tất cả phiên đăng nhập cũ đã được thu hồi. Hãy đăng nhập với mật khẩu mới.",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("[AUTH_RESET_PASSWORD_ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi đặt lại mật khẩu.",
    });
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
