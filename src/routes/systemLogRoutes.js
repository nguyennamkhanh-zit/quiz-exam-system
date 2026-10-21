const express = require("express");
const router = express.Router();
const systemLogController = require("../controllers/systemLogController");
const { authenticate, requireRole } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");

// Chỉ Quản trị viên (Admin) mới có quyền truy cập System Logs
router.use(authenticate, requireRole("admin"));

// Nhật ký hoạt động người dùng (Audit Logs)
router.get("/audit", systemLogController.getAuditLogs);

// Nhật ký kỹ thuật từ Loki (Rate limit tối đa 60 requests/phút để chống spam query)
router.get("/loki", authRateLimiter({ windowMs: 60 * 1000, max: 60 }), systemLogController.getLokiLogs);

module.exports = router;

