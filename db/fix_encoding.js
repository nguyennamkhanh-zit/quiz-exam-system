/**
 * Script phục hồi dữ liệu tiếng Việt chuẩn UTF-8
 * 1. Sao lưu toàn bộ dữ liệu hiện tại vào file JSON an toàn trước khi chỉnh sửa.
 * 2. Cập nhật chính xác các trường tiếng Việt bị lỗi mojibake (exams, questions, choices, users 1-3).
 * 3. Đồng bộ hóa snapshot JSON của các lượt thi attempts đã có.
 * 4. Không can thiệp vào các tài khoản/bản ghi do người dùng tự tạo mới (như user 4 'nnk05').
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/database");

async function fixVietnameseEncoding() {
  console.log("=== BẮT ĐẦU PHỤC HỒI TIẾNG VIỆT UTF-8 ===");

  // 1. SAO LƯU DỮ LIỆU HIỆN TẠI
  const backupDir = path.join(__dirname, "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const [currUsers] = await pool.query("SELECT * FROM users");
  const [currExams] = await pool.query("SELECT * FROM exams");
  const [currQuestions] = await pool.query("SELECT * FROM questions");
  const [currChoices] = await pool.query("SELECT * FROM choices");
  const [currAttempts] = await pool.query("SELECT * FROM attempts");

  const backupData = {
    timestamp: new Date().toISOString(),
    users: currUsers,
    exams: currExams,
    questions: currQuestions,
    choices: currChoices,
    attempts: currAttempts,
  };

  const backupFilePath = path.join(backupDir, `backup_before_utf8_fix_${Date.now()}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`[BACKUP] Đã sao lưu dữ liệu an toàn vào: ${backupFilePath}`);

  // 2. ĐỌC VÀ PARSE DỮ LIỆU CHUẨN TỪ db/seed.sql
  const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  const lines = seedSql.split("\n");
  let current = [];
  const statements = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") && current.length === 0) continue;
    current.push(line);
    if (trimmed.endsWith(";")) {
      statements.push(current.join("\n"));
      current = [];
    }
  }

  const examMap = {};
  const qMap = {};
  const cMap = {};

  statements.forEach((stmt) => {
    if (stmt.includes("INSERT INTO exams")) {
      const matches = [...stmt.matchAll(/\((\d+),\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*([\d\.]+),\s*'([^']+)',\s*(\d+)\)/g)];
      matches.forEach((m) => {
        examMap[parseInt(m[1])] = {
          id: parseInt(m[1]),
          title: m[2],
          description: m[3],
          duration_minutes: parseInt(m[4]),
          passing_score: parseFloat(m[5]),
        };
      });
    }
    if (stmt.includes("INSERT INTO questions")) {
      const matches = [...stmt.matchAll(/\((\d+),\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*(\d+)\)/g)];
      matches.forEach((m) => {
        qMap[parseInt(m[1])] = {
          id: parseInt(m[1]),
          exam_id: parseInt(m[2]),
          question_text: m[3],
          explanation: m[4],
          order_num: parseInt(m[5]),
        };
      });
    }
    if (stmt.includes("INSERT INTO choices")) {
      const matches = [...stmt.matchAll(/\((\d+),\s*(\d+),\s*'([^']+)',\s*(\d+),\s*(\d+)\)/g)];
      matches.forEach((m) => {
        cMap[parseInt(m[1])] = {
          id: parseInt(m[1]),
          question_id: parseInt(m[2]),
          choice_text: m[3],
          is_correct: m[4] === "1",
          order_num: parseInt(m[5]),
        };
      });
    }
  });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 3. SỬA USERS MẪU (1, 2, 3) - GIỮ NGUYÊN MẬT KHẨU VÀ TOKEN VERSION
    console.log("[UPDATE] Đang cập nhật full_name tiếng Việt cho users 1, 2, 3...");
    await connection.query("UPDATE users SET full_name = ? WHERE id = 1", ["Quản trị viên Hệ thống"]);
    await connection.query("UPDATE users SET full_name = ? WHERE id = 2", ["Nguyễn Nam Khánh"]);
    await connection.query("UPDATE users SET full_name = ? WHERE id = 3", ["Trần Văn Minh"]);

    // 4. SỬA BẢNG EXAMS (1, 2, 3)
    console.log("[UPDATE] Đang cập nhật title và description cho bảng exams...");
    for (const id of [1, 2, 3]) {
      const e = examMap[id];
      if (e) {
        await connection.query("UPDATE exams SET title = ?, description = ? WHERE id = ?", [
          e.title,
          e.description,
          id,
        ]);
      }
    }

    // 5. SỬA BẢNG QUESTIONS
    console.log(`[UPDATE] Đang cập nhật question_text và explanation cho ${Object.keys(qMap).length} câu hỏi...`);
    for (const qId of Object.keys(qMap)) {
      const q = qMap[qId];
      await connection.query(
        "UPDATE questions SET question_text = ?, explanation = ? WHERE id = ?",
        [q.question_text, q.explanation, q.id]
      );
    }

    // 6. SỬA BẢNG CHOICES
    console.log(`[UPDATE] Đang cập nhật choice_text cho ${Object.keys(cMap).length} lựa chọn...`);
    for (const cId of Object.keys(cMap)) {
      const c = cMap[cId];
      await connection.query("UPDATE choices SET choice_text = ? WHERE id = ?", [
        c.choice_text,
        c.id,
      ]);
    }

    // 7. SỬA VÀ ĐỒNG BỘ SNAPSHOT CHO BẢNG ATTEMPTS
    console.log(`[UPDATE] Đang cập nhật exam_snapshot_json cho ${currAttempts.length} lượt thi...`);
    for (const att of currAttempts) {
      try {
        const snap = JSON.parse(att.exam_snapshot_json);
        const eData = examMap[att.exam_id];
        if (eData) {
          snap.exam.title = eData.title;
        }

        if (Array.isArray(snap.questions)) {
          snap.questions.forEach((q) => {
            const cleanQ = qMap[q.id];
            if (cleanQ) {
              q.question_text = cleanQ.question_text;
              q.explanation = cleanQ.explanation;
            }
            if (Array.isArray(q.choices)) {
              q.choices.forEach((c) => {
                const cleanC = cMap[c.id];
                if (cleanC) {
                  c.choice_text = cleanC.choice_text;
                }
              });
            }
          });
        }

        await connection.query(
          "UPDATE attempts SET exam_snapshot_json = ? WHERE id = ?",
          [JSON.stringify(snap), att.id]
        );
      } catch (parseErr) {
        console.warn(`[WARN] Bỏ qua attempt ${att.id} do lỗi JSON: ${parseErr.message}`);
      }
    }

    await connection.commit();
    console.log("=== HOÀN TẤT PHỤC HỒI TIẾNG VIỆT THÀNH CÔNG ===");
  } catch (err) {
    await connection.rollback();
    console.error("[ERROR] Rollback do phát sinh lỗi:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  fixVietnameseEncoding()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fixVietnameseEncoding };

