const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const { authenticate, requireRole } = require("../middleware/auth");
const { csrfProtection } = require("../middleware/csrf");

// Xem danh sách đề thi (Thí sinh & Admin)
router.get("/", authenticate, examController.getExams);
router.get("/trash", authenticate, requireRole("admin"), examController.getTrashExams);
router.get("/:id", authenticate, examController.getExamById);

// Quản trị đề thi (Admin only)
router.post("/", authenticate, requireRole("admin"), csrfProtection, examController.createExam);
router.put("/:id", authenticate, requireRole("admin"), csrfProtection, examController.updateExam);
router.delete("/:id", authenticate, requireRole("admin"), csrfProtection, examController.deleteExam);
router.post("/:id/restore", authenticate, requireRole("admin"), csrfProtection, examController.restoreExam);
router.post("/:id/questions", authenticate, requireRole("admin"), csrfProtection, examController.addQuestion);
router.delete("/questions/:questionId", authenticate, requireRole("admin"), csrfProtection, examController.deleteQuestion);
router.get("/:id/results", authenticate, requireRole("admin"), examController.getExamResults);

module.exports = router;
