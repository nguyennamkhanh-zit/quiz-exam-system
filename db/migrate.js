require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { seedData } = require("./seed");

async function runMigration() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "quiz_user";
  const password = process.env.DB_PASSWORD || "QuizPass@123456";
  const database = process.env.DB_NAME || "quiz_db";

  console.log(`[MIGRATION] Kết nối tới MySQL ${host}:${port}, db=${database}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database });
  } catch (err) {
    console.error("[MIGRATION ERROR] Lỗi kết nối DB:", err.message);
    process.exit(1);
  }

  try {
    console.log("[MIGRATION] Đang chạy schema.sql...");
    const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await connection.query(schemaSql);
    console.log("[MIGRATION] Schema hoàn thành.");

    console.log("[MIGRATION] Đang chạy seed an toàn (seed.js)...");
    await seedData(connection);
    console.log("[MIGRATION] Migration & Seed hoàn tất.");
  } catch (err) {
    console.error("[MIGRATION ERROR] Lỗi thực thi:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runMigration().then(() => {
    console.log("[MIGRATION] Hoàn thành!");
    process.exit(0);
  });
}

module.exports = { runMigration };
