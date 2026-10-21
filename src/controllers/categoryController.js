const { pool } = require("../config/database");
const { logAudit } = require("../services/auditService");

// Lấy danh sách toàn bộ danh mục kèm số lượng bài thi published
async function getCategories(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.slug, c.description, c.order_num,
             COUNT(CASE WHEN e.status = 'published' THEN e.id END) AS published_exam_count,
             COUNT(e.id) AS total_exam_count
      FROM categories c
      LEFT JOIN exams e ON c.id = e.category_id
      GROUP BY c.id
      ORDER BY c.order_num ASC, c.id ASC
    `);

    // Lấy thêm số lượng đề thi chưa được phân loại (category_id IS NULL)
    const [uncategorized] = await pool.query(`
      SELECT COUNT(CASE WHEN status = 'published' THEN id END) AS published_exam_count,
             COUNT(id) AS total_exam_count
      FROM exams
      WHERE category_id IS NULL
    `);

    return res.status(200).json({
      success: true,
      categories: rows,
      uncategorized: uncategorized[0] || { published_exam_count: 0, total_exam_count: 0 },
    });
  } catch (error) {
    console.error("[GET_CATEGORIES_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Không thể lấy danh sách danh mục." });
  }
}

// Tạo danh mục mới (Admin only)
async function createCategory(req, res) {
  try {
    const { name, slug, description, order_num } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Tên danh mục là bắt buộc." });
    }

    const trimmedName = name.trim();
    let generatedSlug = (slug && typeof slug === "string" ? slug.trim() : "")
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    if (!generatedSlug) {
      generatedSlug = trimmedName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    }

    const order = parseInt(order_num, 10) || 1;

    // Kiểm tra trùng lặp
    const [existing] = await pool.query(
      "SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1",
      [trimmedName, generatedSlug]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Tên hoặc slug danh mục đã tồn tại." });
    }

    const [result] = await pool.query(
      "INSERT INTO categories (name, slug, description, order_num) VALUES (?, ?, ?, ?)",
      [trimmedName, generatedSlug, description ? description.trim() : null, order]
    );

    await logAudit({
      action: "CREATE_CATEGORY",
      entityType: "category",
      entityId: result.insertId,
      details: { name: trimmedName, slug: generatedSlug },
      status: "success",
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công.",
      category: {
        id: result.insertId,
        name: trimmedName,
        slug: generatedSlug,
        description,
        order_num: order,
      },
    });
  } catch (error) {
    console.error("[CREATE_CATEGORY_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi tạo danh mục." });
  }
}

// Cập nhật danh mục (Admin only)
async function updateCategory(req, res) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const { name, slug, description, order_num } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Tên danh mục là bắt buộc." });
    }

    const [existing] = await pool.query("SELECT id FROM categories WHERE id = ?", [categoryId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục." });
    }

    const trimmedName = name.trim();
    const order = parseInt(order_num, 10) || 1;

    // Kiểm tra trùng lặp với danh mục khác
    const [conflict] = await pool.query(
      "SELECT id FROM categories WHERE (name = ? OR slug = ?) AND id != ? LIMIT 1",
      [trimmedName, slug ? slug.trim() : "", categoryId]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ success: false, message: "Tên hoặc slug đã được sử dụng bởi danh mục khác." });
    }

    await pool.query(
      "UPDATE categories SET name = ?, slug = ?, description = ?, order_num = ? WHERE id = ?",
      [trimmedName, slug ? slug.trim() : trimmedName.toLowerCase().replace(/\s+/g, "-"), description ? description.trim() : null, order, categoryId]
    );

    await logAudit({
      action: "UPDATE_CATEGORY",
      entityType: "category",
      entityId: categoryId,
      details: { name: trimmedName },
      status: "success",
      req,
    });

    return res.status(200).json({ success: true, message: "Cập nhật danh mục thành công." });
  } catch (error) {
    console.error("[UPDATE_CATEGORY_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật danh mục." });
  }
}

// Xóa danh mục (Admin only) - Không cho xóa nếu đang có đề thi
async function deleteCategory(req, res) {
  try {
    const categoryId = parseInt(req.params.id, 10);

    const [existing] = await pool.query("SELECT id, name FROM categories WHERE id = ?", [categoryId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục." });
    }

    // Kiểm tra xem có đề thi nào đang thuộc danh mục này không
    const [exams] = await pool.query("SELECT COUNT(*) AS total FROM exams WHERE category_id = ?", [categoryId]);
    if (exams[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục "${existing[0].name}" vì đang có ${exams[0].total} đề thi thuộc danh mục này. Vui lòng chuyển hoặc xóa các đề thi liên quan trước.`,
      });
    }

    await pool.query("DELETE FROM categories WHERE id = ?", [categoryId]);

    await logAudit({
      action: "DELETE_CATEGORY",
      entityType: "category",
      entityId: categoryId,
      details: { name: existing[0].name },
      status: "success",
      req,
    });

    return res.status(200).json({ success: true, message: `Đã xóa danh mục "${existing[0].name}" thành công.` });
  } catch (error) {
    console.error("[DELETE_CATEGORY_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi xóa danh mục." });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

