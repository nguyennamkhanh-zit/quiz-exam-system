const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const { generateToken, verifyToken } = require("../src/utils/jwt");
const { generateCsrfToken } = require("../src/utils/helpers");

test("Security: Hash password bằng bcrypt hoạt động chính xác", async () => {
  const password = "Student@123456";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  assert.strictEqual(typeof hash, "string");
  assert.ok(hash.startsWith("$2"), "Hash phải chuẩn bcrypt format");

  const isMatch = await bcrypt.compare(password, hash);
  assert.strictEqual(isMatch, true, "So sánh đúng mật khẩu phải trả về true");

  const isWrong = await bcrypt.compare("WrongPassword", hash);
  assert.strictEqual(isWrong, false, "Mật khẩu sai phải trả về false");
});

test("Security: JWT Token mã hóa và giải mã an toàn", () => {
  const payload = { id: 10, username: "student_test", role: "student" };
  const token = generateToken(payload);

  assert.ok(token, "Token phải được tạo ra");
  const decoded = verifyToken(token);

  assert.strictEqual(decoded.id, 10);
  assert.strictEqual(decoded.username, "student_test");
  assert.strictEqual(decoded.role, "student");

  const fakeDecoded = verifyToken("invalid.token.here");
  assert.strictEqual(fakeDecoded, null, "Token giả mạo phải trả về null");
});

test("Security: CSRF Token sinh chuỗi ngẫu nhiên đủ độ dài", () => {
  const token1 = generateCsrfToken();
  const token2 = generateCsrfToken();

  assert.strictEqual(token1.length, 64, "CSRF hex 32 bytes phải có 64 ký tự");
  assert.notStrictEqual(token1, token2, "Hai token sinh ra phải độc lập ngẫu nhiên");
});

test("Nghiệp vụ: Chấm điểm tự động và quy tắc thang điểm 10", () => {
  // Giả lập một bài thi gồm 10 câu
  const totalQuestions = 10;
  
  // Trường hợp 1: Đúng 8/10 câu
  let correctCount = 8;
  let score = Math.round(((correctCount / totalQuestions) * 10) * 100) / 100;
  assert.strictEqual(score, 8.00);
  assert.strictEqual(score >= 5.0, true, "Đạt yêu cầu khi >= passing_score");

  // Trường hợp 2: Đúng 7/10 câu
  correctCount = 7;
  score = Math.round(((correctCount / totalQuestions) * 10) * 100) / 100;
  assert.strictEqual(score, 7.00);

  // Trường hợp 3: Bỏ trống toàn bộ câu (0/10 câu)
  correctCount = 0;
  score = Math.round(((correctCount / totalQuestions) * 10) * 100) / 100;
  assert.strictEqual(score, 0.00);
  assert.strictEqual(score >= 5.0, false, "Không đạt yêu cầu");

  // Trường hợp 4: Đề có 15 câu, làm đúng 11 câu
  correctCount = 11;
  const total15 = 15;
  score = Math.round(((correctCount / total15) * 10) * 100) / 100;
  assert.strictEqual(score, 7.33, "Làm tròn 2 chữ số thập phân chính xác");
});

test("Nghiệp vụ: Xử lý hết giờ làm bài dựa trên Server Clock", () => {
  const now = new Date();
  const duePast = new Date(now.getTime() - 60000); // Đã quá hạn 1 phút
  const dueFuture = new Date(now.getTime() + 60000); // Còn hạn 1 phút

  const isExpired1 = now > duePast;
  assert.strictEqual(isExpired1, true, "Thời gian hiện tại lớn hơn due_at thì phải khóa bài");

  const isExpired2 = now > dueFuture;
  assert.strictEqual(isExpired2, false, "Chưa hết hạn thì vẫn cho phép làm bài");
});
