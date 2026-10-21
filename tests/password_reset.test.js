const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const { pool } = require("../src/config/database");
const { mailer } = require("../src/services/mailService");
const { forgotPassword, verifyResetToken, resetPassword } = require("../src/controllers/authController");

describe("Password Reset & RBAC Integration Tests", () => {
  let studentUser;
  let rawToken;

  before(async () => {
    // Đảm bảo student2 tồn tại và có mật khẩu ban đầu
    const [rows] = await pool.query("SELECT id, username, email, token_version FROM users WHERE id = 3 LIMIT 1");
    studentUser = rows[0];
    assert.ok(studentUser, "student2 must exist in database");
  });

  test("1. Forgot Password generates token in DB and sends mock email", async () => {
    const req = { body: { email: studentUser.email } };
    let resData;
    const res = {
      status: (code) => ({
        json: (data) => { resData = { code, ...data }; return res; }
      })
    };

    await forgotPassword(req, res);
    assert.strictEqual(resData.code, 200);
    assert.strictEqual(resData.success, true);

    // Kiểm tra mock email
    const lastMail = mailer.sentEmails[mailer.sentEmails.length - 1];
    assert.ok(lastMail, "Mock email must be recorded");
    assert.strictEqual(lastMail.to, studentUser.email);

    // Trích xuất rawToken
    const match = lastMail.text.match(/#reset-password\/([a-f0-9]+)/);
    assert.ok(match, "Token must be present in email body");
    rawToken = match[1];
    assert.strictEqual(rawToken.length, 64, "Token hex must be 64 characters (32 bytes)");

    // Kiểm tra token_hash trong database
    const [resets] = await pool.query(
      "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE user_id = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1",
      [studentUser.id]
    );
    assert.strictEqual(resets.length, 1);
    assert.strictEqual(resets[0].used_at, null);
  });

  test("2. Verify Reset Token via GET returns 200 without consuming token", async () => {
    assert.ok(rawToken, "rawToken must be defined from test 1");
    const req = { query: { token: rawToken } };
    let resData;
    const res = {
      status: (code) => ({
        json: (data) => { resData = { code, ...data }; return res; }
      })
    };

    await verifyResetToken(req, res);
    assert.strictEqual(resData.code, 200);
    assert.strictEqual(resData.success, true);

    // Xác nhận token vẫn chưa bị đánh dấu used_at
    const [resets] = await pool.query(
      "SELECT used_at FROM password_resets WHERE user_id = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1",
      [studentUser.id]
    );
    assert.strictEqual(resets.length, 1, "Token must NOT be consumed by GET request");
  });

  test("3. Verify invalid or expired token is rejected", async () => {
    let resData;
    const res = {
      status: (code) => ({
        json: (data) => { resData = { code, ...data }; return res; }
      })
    };

    await verifyResetToken({ query: { token: "invalid_hex_token_123" } }, res);
    assert.strictEqual(resData.code, 404);
    assert.strictEqual(resData.success, false);
  });

  test("4. Reset Password via POST consumes token and increments token_version", async () => {
    const [userBefore] = await pool.query("SELECT token_version FROM users WHERE id = ?", [studentUser.id]);
    const oldVersion = userBefore[0].token_version;

    let resData;
    const res = {
      status: (code) => ({
        json: (data) => { resData = { code, ...data }; return res; }
      })
    };

    await resetPassword({
      body: {
        token: rawToken,
        new_password: "BrandNewPassword@123",
        confirm_password: "BrandNewPassword@123"
      }
    }, res);

    assert.strictEqual(resData.code, 200);
    assert.strictEqual(resData.success, true);

    // Kiểm tra token_version đã tăng
    const [userAfter] = await pool.query("SELECT password_hash, token_version FROM users WHERE id = ?", [studentUser.id]);
    assert.strictEqual(userAfter[0].token_version, oldVersion + 1, "token_version must increment to revoke old sessions");

    // Kiểm tra token đã bị đánh dấu used_at
    const [resetCheck] = await pool.query(
      "SELECT used_at FROM password_resets WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [studentUser.id]
    );
    assert.notStrictEqual(resetCheck[0].used_at, null, "used_at must be populated");
  });

  test("5. Reusing consumed token is rejected with 400", async () => {
    let resData;
    const res = {
      status: (code) => ({
        json: (data) => { resData = { code, ...data }; return res; }
      })
    };

    await resetPassword({
      body: {
        token: rawToken,
        new_password: "AttemptReuse@123",
        confirm_password: "AttemptReuse@123"
      }
    }, res);

    assert.strictEqual(resData.code, 400);
    assert.strictEqual(resData.success, false);
  });

  after(async () => {
    // Khôi phục mật khẩu Student@123456 cho student2
    const restoredHash = await bcrypt.hash("Student@123456", 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [restoredHash, studentUser.id]);
  });
});

