const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticate, requireRole } = require("../middleware/auth");
const { csrfProtection } = require("../middleware/csrf");

// Công khai danh sách danh mục
router.get("/", categoryController.getCategories);

// Quản trị danh mục (Admin only)
router.post("/", authenticate, requireRole("admin"), csrfProtection, categoryController.createCategory);
router.put("/:id", authenticate, requireRole("admin"), csrfProtection, categoryController.updateCategory);
router.delete("/:id", authenticate, requireRole("admin"), csrfProtection, categoryController.deleteCategory);

module.exports = router;

