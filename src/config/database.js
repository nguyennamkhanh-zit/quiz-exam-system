const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "quiz_user",
  password: process.env.DB_PASSWORD || "QuizPass@123456",
  database: process.env.DB_NAME || "quiz_db",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  timezone: "+00:00",
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Helper kiểm tra kết nối cho Healthcheck
async function checkDatabaseConnection() {
  try {
    const [rows] = await pool.query("SELECT 1 AS ready");
    return rows && rows.length > 0;
  } catch (error) {
    return false;
  }
}

module.exports = {
  pool,
  checkDatabaseConnection,
};
