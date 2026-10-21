const express = require("express");
const router = express.Router();
const attemptController = require("../controllers/attemptController");
const { authenticate } = require("../middleware/auth");
const { csrfProtection } = require("../middleware/csrf");

// Thí sinh làm bài thi
router.post("/start/:examId", authenticate, csrfProtection, attemptController.startAttempt);
router.get("/:id", authenticate, attemptController.getAttemptDetails);
router.post("/:id/answer", authenticate, csrfProtection, attemptController.saveAnswer);
router.post("/:id/submit", authenticate, csrfProtection, attemptController.submitAttempt);
router.get("/:id/review", authenticate, attemptController.getAttemptReview);

// Xem lịch sử thi của cá nhân
router.get("/my/history", authenticate, attemptController.getMyAttempts);

module.exports = router;
