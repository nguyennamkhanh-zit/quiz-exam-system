require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { checkDatabaseConnection } = require("./config/database");
const { recordMetrics, getPrometheusMetricsText } = require("./utils/metrics");
const { issueCsrfCookie } = require("./middleware/csrf");

const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const systemLogRoutes = require("./routes/systemLogRoutes");

const app = express();
const PORT = process.env.PORT || 18095;

// Thiết lập Helmet Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Cấp phát CSRF cookie cho mọi request nếu chưa có
app.use(issueCsrfCookie);

// Middleware ghi nhận Prometheus Metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    recordMetrics(req, res, duration);
  });
  next();
});

// Logging có cấu trúc chuẩn cho Promtail/Loki (Ghi stdout và file nếu có volume)
const appLogDir = process.env.LOG_DIR || "/var/log/app";
let appFileStream = null;
try {
  if (!fs.existsSync(appLogDir)) {
    fs.mkdirSync(appLogDir, { recursive: true });
  }
  appFileStream = fs.createWriteStream(path.join(appLogDir, "app.log"), { flags: "a" });
} catch (e) {
  // Bỏ qua nếu môi trường dev không đủ quyền tạo thư mục root
}

morgan.token("remote-addr-forwarded", (req) => {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
});

const logFormat =
  '{"time":":date[iso]","remote_ip":":remote-addr-forwarded","method":":method","url":":url","status"::status,"response_time_ms"::response-time}';

app.use(morgan(logFormat));
if (appFileStream) {
  app.use(morgan(logFormat, { stream: appFileStream }));
}

// Phục vụ Static Frontend
app.use(express.static(path.join(__dirname, "../public")));

// Endpoint kiểm tra sức khỏe hệ thống (Health & Readiness)
app.get("/health", async (req, res) => {
  const dbOk = await checkDatabaseConnection();
  const status = dbOk ? "ok" : "degraded";
  const statusCode = dbOk ? 200 : 503;

  res.status(statusCode).json({
    status,
    service: "quiz-exam-system",
    database: dbOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
  });
});

// Endpoint xuất Metrics chuẩn Prometheus
app.get("/metrics", (req, res) => {
  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(getPrometheusMetricsText());
});

// Tích hợp API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/logs", systemLogRoutes);

// Fallback cho Single Page App / Static pages
app.get("/{*splat}", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API endpoint không tồn tại." });
  }
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[SERVER_ERROR]", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Đã xảy ra lỗi máy chủ nội bộ.",
  });
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[QUIZ SYSTEM] Server đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
