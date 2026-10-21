const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");
const { csrfProtection } = require("../middleware/csrf");

// Áp dụng rate limiter cho đăng ký và đăng nhập
router.post("/register", authRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), authController.register);
router.post("/login", authRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }), authController.login);
router.post("/logout", authenticate, csrfProtection, authController.logout);
router.get("/me", authenticate, authController.getCurrentUser);

// Quên mật khẩu & Đặt lại mật khẩu (Rate limited)
router.post("/forgot-password", authRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), authController.forgotPassword);
router.get("/verify-reset-token", authRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }), authController.verifyResetToken);
router.post("/reset-password", authRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), authController.resetPassword);

module.exports = router;

