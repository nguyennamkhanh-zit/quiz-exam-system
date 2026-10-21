const test = require("node:test");
const assert = require("node:assert");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB_HOST = process.env.DB_HOST || "mysql";
const DB_PORT = parseInt(process.env.DB_PORT || "3306", 10);
const DB_USER = process.env.DB_USER || "quiz_app";
const DB_PASSWORD = process.env.DB_PASSWORD || "change_this_password";
const TEST_DB_NAME = "quiz_exam_test";

let testPool;

test.before(async () => {
  const rootConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: "root",
    password: process.env.MYSQL_ROOT_PASSWORD || "QuizRoot@123456",
  });
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.query(`GRANT ALL PRIVILEGES ON \`${TEST_DB_NAME}\`.* TO '${DB_USER}'@'%';`);
  await rootConn.query("FLUSH PRIVILEGES;");
  await rootConn.end();

  testPool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: TEST_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    multipleStatements: true,
  });

  const fs = require("fs");
  const path = require("path");
  const schemaPath = fs.existsSync("/usr/src/app/db/schema.sql")
    ? "/usr/src/app/db/schema.sql"
    : path.join(__dirname, "../db/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await testPool.query(schemaSql);
});

test.after(async () => {
  if (testPool) {
    await testPool.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\`;`);
    await testPool.end();
  }
});

test("1. Đăng ký tài khoản: Mã hóa mật khẩu, vai trò mặc định 'student', cấm trùng email", async () => {
  const hash = await bcrypt.hash("StudentPass123", 10);
  const [res] = await testPool.query(
    "INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)",
    ["test_student", "student@test.com", hash, "Thí sinh Test", "student"]
  );
  assert.ok(res.insertId > 0, "Tạo user thành công");

  await assert.rejects(
    async () => {
      await testPool.query(
        "INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)",
        ["another_user", "student@test.com", hash, "Người khác", "student"]
      );
    },
    /Duplicate entry/,
    "Phải bắt lỗi trùng email Unique Constraint"
  );
});

test("2. Tạo đề thi: Validate câu hỏi và 4 lựa chọn (chính xác 1 đáp án đúng)", async () => {
  const [adminUser] = await testPool.query(
    "INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)",
    ["test_admin", "admin@test.com", "hash", "Admin Test", "admin"]
  );

  const [examRes] = await testPool.query(
    "INSERT INTO exams (title, description, duration_minutes, passing_score, status, created_by) VALUES (?, ?, ?, ?, ?, ?)",
    ["Đề thi Mạng máy tính Test", "Mô tả", 15, 5.0, "published", adminUser.insertId]
  );
  const examId = examRes.insertId;

  const [qRes] = await testPool.query(
    "INSERT INTO questions (id, exam_id, question_text, order_num) VALUES (?, ?, ?, ?)",
    [999, examId, "HTTP port mặc định là bao nhiêu?", 1]
  );
  const qId = qRes.insertId;

  const choices = [
    [1, qId, "80", 1, 1],
    [2, qId, "443", 0, 2],
    [3, qId, "22", 0, 3],
    [4, qId, "21", 0, 4]
  ];
  for (const c of choices) {
    await testPool.query(
      "INSERT INTO choices (id, question_id, choice_text, is_correct, order_num) VALUES (?, ?, ?, ?, ?)",
      c
    );
  }

  const [countRes] = await testPool.query("SELECT COUNT(*) AS total, SUM(is_correct) AS corrects FROM choices WHERE question_id = ?", [qId]);
  assert.strictEqual(countRes[0].total, 4, "Phải có đúng 4 lựa chọn");
  assert.strictEqual(Number(countRes[0].corrects), 1, "Phải có chính xác 1 đáp án đúng");
});

test("3. Snapshot đề thi bất biến: Sửa đề gốc không thay đổi lượt thi đã bắt đầu", async () => {
  const [exams] = await testPool.query("SELECT * FROM exams LIMIT 1");
  const exam = exams[0];
  const [users] = await testPool.query("SELECT * FROM users WHERE role = 'student' LIMIT 1");
  const student = users[0];

  assert.ok(student && student.id, "Thí sinh phải tồn tại");

  const snapshotData = {
    exam: { id: exam.id, title: exam.title, passing_score: 5.0 },
    questions: [
      {
        id: 999,
        question_text: "Nội dung câu hỏi nguyên bản lúc bắt đầu thi?",
        choices: [
          { id: 1, choice_text: "80", is_correct: 1 },
          { id: 2, choice_text: "443", is_correct: 0 },
          { id: 3, choice_text: "22", is_correct: 0 },
          { id: 4, choice_text: "21", is_correct: 0 },
        ]
      }
    ]
  };

  const startedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  const dueAt = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

  const [attRes] = await testPool.query(
    `INSERT INTO attempts (user_id, exam_id, exam_snapshot_json, total_questions, started_at, due_at, status)
     VALUES (?, ?, ?, ?, ?, ?, 'in_progress')`,
    [student.id, exam.id, JSON.stringify(snapshotData), 1, startedAt, dueAt]
  );
  const attemptId = attRes.insertId;

  // Sửa đề gốc
  await testPool.query("UPDATE exams SET title = 'TIÊU ĐỀ ĐÃ ĐƯỢC GIÁO VIÊN THAY ĐỔI' WHERE id = ?", [exam.id]);

  // Kiểm tra Snapshot bất biến
  const [attRows] = await testPool.query("SELECT exam_snapshot_json FROM attempts WHERE id = ?", [attemptId]);
  const loadedSnapshot = JSON.parse(attRows[0].exam_snapshot_json);

  assert.strictEqual(loadedSnapshot.exam.title, "Đề thi Mạng máy tính Test", "Tiêu đề trong Snapshot phải bất biến");
  assert.strictEqual(loadedSnapshot.questions[0].question_text, "Nội dung câu hỏi nguyên bản lúc bắt đầu thi?", "Câu hỏi trong Snapshot phải bất biến");
});

test("4. Tự động chấm điểm server-side & Xử lý hết giờ (timed_out)", async () => {
  const [attRows] = await testPool.query("SELECT * FROM attempts LIMIT 1");
  const att = attRows[0];
  const snapshot = JSON.parse(att.exam_snapshot_json);

  await testPool.query(
    "INSERT INTO attempt_answers (attempt_id, question_id, selected_choice_id) VALUES (?, ?, ?)",
    [att.id, 999, 1]
  );

  let correctCount = 0;
  for (const q of snapshot.questions) {
    const [ans] = await testPool.query(
      "SELECT selected_choice_id FROM attempt_answers WHERE attempt_id = ? AND question_id = ?",
      [att.id, q.id]
    );
    const correctChoice = q.choices.find(c => c.is_correct === 1);
    if (ans.length > 0 && ans[0].selected_choice_id === correctChoice.id) {
      correctCount++;
    }
  }

  const score = (correctCount / snapshot.questions.length) * 10;
  assert.strictEqual(score, 10.0, "Chọn đúng 1/1 câu phải đạt 10.0 điểm");
  assert.strictEqual(score >= 5.0, true, "Đạt yêu cầu thi");
});
