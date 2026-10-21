require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function seedData(targetPool) {
  console.log("[SEED] Bắt đầu nạp dữ liệu mẫu (Idempotent Seed)...");

  // 1. Nạp Categories
  const categories = [
    [1, "Triển khai & Quản trị Hệ thống", "trien-khai-quan-tri-he-thong", "Các bài thi về tổng quan HTPM, Container Docker, Docker Compose, Nginx Reverse Proxy, Prometheus, Grafana và Loki.", 1],
    [2, "An toàn Thông tin", "an-toan-thong-tin", "Bảo mật ứng dụng Web, OWASP Top 10, phòng chống XSS, SQL Injection, CSRF, cấu hình Security Headers và quản trị phân quyền.", 2],
    [3, "Mạng Máy tính", "mang-may-tinh", "Kiến thức mô hình OSI, TCP/IP, địa chỉ IP subnet, định tuyến, DNS, giao thức HTTP/HTTPS, SSL/TLS và Reverse Proxy.", 3],
    [4, "Cơ sở Dữ liệu", "co-so-du-lieu", "Cơ sở dữ liệu quan hệ MySQL, ngôn ngữ SQL, truy vấn JOIN, GROUP BY, Transaction ACID, tối ưu Index và chiến lược sao lưu dữ liệu.", 4],
    [5, "Lập trình Web", "lap-trinh-web", "Nền tảng phát triển Web với HTML5, CSS3 hiện đại, JavaScript ES6+, DOM Events, Node.js, Express và kiến trúc chuẩn RESTful API.", 5],
  ];

  for (const c of categories) {
    await targetPool.query(
      `INSERT INTO categories (id, name, slug, description, order_num)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), description = VALUES(description), order_num = VALUES(order_num)`,
      c
    );
  }
  console.log("[SEED] 5 Danh mục đã được đồng bộ.");

  // 2. Nạp Users mẫu với dynamic hash
  const adminPass = process.env.DEMO_ADMIN_PASSWORD || "Admin@123456";
  const studentPass = process.env.DEMO_STUDENT_PASSWORD || "Student@123456";

  const adminHash = await bcrypt.hash(adminPass, 10);
  const studentHash = await bcrypt.hash(studentPass, 10);

  const users = [
    [1, "admin", "admin@ictu.edu.vn", adminHash, "Quản trị viên Hệ thống", "admin"],
    [2, "student1", "student1@ictu.edu.vn", studentHash, "Nguyễn Nam Khánh", "student"],
    [3, "student2", "student2@ictu.edu.vn", studentHash, "Trần Văn Minh", "student"],
  ];

  for (const u of users) {
    await targetPool.query(
      `INSERT INTO users (id, username, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name)`,
      u
    );
  }
  console.log("[SEED] Tài khoản người dùng mẫu đã được cập nhật.");

  // 3. Thực thi file seed.sql (gồm 15 đề thi, 150 câu hỏi, 600 lựa chọn với ON DUPLICATE KEY UPDATE)
  const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  
  // Tách các câu lệnh theo dấu chấm phẩy ở cuối dòng
  const lines = seedSql.split("\n");
  let currentStmt = [];
  const statements = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") && currentStmt.length === 0) continue;
    currentStmt.push(line);
    if (trimmed.endsWith(";")) {
      statements.push(currentStmt.join("\n"));
      currentStmt = [];
    }
  }

  for (const stmt of statements) {
    if (stmt.trim().length > 0) {
      await targetPool.query(stmt);
    }
  }
  console.log(`[SEED] Đã thực thi ${statements.length} khối lệnh seed chuẩn.`);
}

if (require.main === module) {
  const { pool } = require("../src/config/database");
  seedData(pool)
    .then(() => {
      console.log("[SEED] Dữ liệu 15 đề thi và danh mục đã nạp hoàn tất an toàn.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[SEED ERROR]", err.message);
      process.exit(1);
    });
}

module.exports = { seedData };
