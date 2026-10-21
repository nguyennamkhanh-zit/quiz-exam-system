const { pool } = require("../config/database");
const { logAudit } = require("../services/auditService");

// Lấy danh sách đề thi (Thí sinh chỉ thấy published và chưa xóa; Admin thấy all chưa xóa; hỗ trợ lọc category và search)
async function getExams(req, res) {
  try {
    const isAdmin = req.user && req.user.role === "admin";
    const { category, search } = req.query;

    let query = `
      SELECT e.id, e.title, e.description, e.category_id, e.duration_minutes, e.passing_score, e.status, e.created_at, e.deleted_at,
             c.name AS category_name, c.slug AS category_slug,
             u.full_name AS creator_name,
             COUNT(q.id) AS question_count
      FROM exams e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN questions q ON e.id = q.exam_id
      WHERE e.deleted_at IS NULL
    `;
    const params = [];

    if (!isAdmin) {
      query += " AND e.status = 'published'";
    }

    // Lọc theo Category
    if (category !== undefined && category !== null && String(category).trim() !== "") {
      const catVal = String(category).trim();
      if (catVal === "uncategorized" || catVal === "0") {
        query += " AND e.category_id IS NULL";
      } else if (!isNaN(parseInt(catVal, 10)) && String(parseInt(catVal, 10)) === catVal) {
        query += " AND e.category_id = ?";
        params.push(parseInt(catVal, 10));
      } else {
        query += " AND c.slug = ?";
        params.push(catVal);
      }
    }

    // Lọc theo Từ khóa tìm kiếm
    if (search && typeof search === "string" && search.trim().length > 0) {
      const searchKeyword = `%${search.trim()}%`;
      query += " AND (e.title LIKE ? OR e.description LIKE ?)";
      params.push(searchKeyword, searchKeyword);
    }

    query += " GROUP BY e.id ORDER BY e.id ASC";

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, exams: rows });
  } catch (error) {
    console.error("[GET_EXAMS_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Không thể lấy danh sách đề thi." });
  }
}

// Lấy danh sách đề thi trong Thùng rác (Admin only)
async function getTrashExams(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT e.id, e.title, e.description, e.category_id, e.duration_minutes, e.passing_score, e.status, e.created_at, e.deleted_at,
             c.name AS category_name,
             u.full_name AS creator_name,
             COUNT(q.id) AS question_count
      FROM exams e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN questions q ON e.id = q.exam_id
      WHERE e.deleted_at IS NOT NULL
      GROUP BY e.id
      ORDER BY e.deleted_at DESC
    `);
    return res.status(200).json({ success: true, exams: rows });
  } catch (error) {
    console.error("[GET_TRASH_EXAMS_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi lấy danh sách đề trong thùng rác." });
  }
}

// Lấy chi tiết đề thi
async function getExamById(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);
    const isAdmin = req.user && req.user.role === "admin";

    const [exams] = await pool.query(
      "SELECT e.*, c.name AS category_name FROM exams e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ?",
      [examId]
    );
    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đề thi." });
    }

    const exam = exams[0];
    if (exam.deleted_at !== null && !isAdmin) {
      return res.status(404).json({ success: false, message: "Đề thi đã bị xóa hoặc không tồn tại." });
    }

    if (!isAdmin && exam.status !== "published") {
      return res.status(403).json({ success: false, message: "Đề thi này chưa được công bố." });
    }

    let questions = [];
    if (isAdmin) {
      const [qRows] = await pool.query(
        "SELECT id, question_text, explanation, order_num FROM questions WHERE exam_id = ? ORDER BY order_num ASC",
        [examId]
      );

      for (const q of qRows) {
        const [cRows] = await pool.query(
          "SELECT id, choice_text, is_correct, order_num FROM choices WHERE question_id = ? ORDER BY order_num ASC",
          [q.id]
        );
        questions.push({
          ...q,
          choices: cRows,
        });
      }
    }

    return res.status(200).json({
      success: true,
      exam,
      questions,
    });
  } catch (error) {
    console.error("[GET_EXAM_BY_ID_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi lấy chi tiết đề thi." });
  }
}

// Tạo đề thi mới (Admin only)
async function createExam(req, res) {
  try {
    const { title, description, category_id, duration_minutes, passing_score, status } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Tiêu đề đề thi không được để trống." });
    }

    const duration = parseInt(duration_minutes, 10);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ success: false, message: "Thời lượng thi phải là số phút nguyên dương." });
    }

    const passing = parseFloat(passing_score);
    if (isNaN(passing) || passing < 0 || passing > 10) {
      return res.status(400).json({ success: false, message: "Điểm đạt phải nằm trong khoảng từ 0.0 đến 10.0." });
    }

    let categoryId = null;
    if (category_id !== undefined && category_id !== null && category_id !== "" && category_id !== 0) {
      const parsedCat = parseInt(category_id, 10);
      if (!isNaN(parsedCat)) {
        const [catCheck] = await pool.query("SELECT id FROM categories WHERE id = ?", [parsedCat]);
        if (catCheck.length === 0) {
          return res.status(400).json({ success: false, message: "Danh mục đã chọn không tồn tại." });
        }
        categoryId = parsedCat;
      }
    }

    // Đề mới tạo chưa có câu hỏi thì không được công bố (published) ngay
    const initialStatus = status === "published" ? "draft" : (status || "draft");

    const [result] = await pool.query(
      `INSERT INTO exams (title, description, category_id, duration_minutes, passing_score, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description ? description.trim() : "", categoryId, duration, passing, initialStatus, req.user.id]
    );

    await logAudit({
      action: "CREATE_EXAM",
      entityType: "exam",
      entityId: result.insertId,
      details: { title: title.trim(), status: initialStatus },
      status: "success",
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo đề thi thành công.",
      examId: result.insertId,
    });
  } catch (error) {
    console.error("[CREATE_EXAM_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi tạo đề thi." });
  }
}

// Cập nhật thông tin và trạng thái đề thi (Admin only)
// Backend bắt buộc kiểm tra điều kiện công bố: đề phải có câu hỏi hợp lệ, mỗi câu đủ 4 lựa chọn và đúng 1 đáp án đúng
async function updateExam(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);
    const { title, description, category_id, duration_minutes, passing_score, status } = req.body;

    const [existing] = await pool.query("SELECT * FROM exams WHERE id = ?", [examId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đề thi." });
    }
    const currentExam = existing[0];

    // Kiểm tra điều kiện khi công bố đề thi (status = 'published')
    if (status === "published") {
      const [qRows] = await pool.query("SELECT id FROM questions WHERE exam_id = ?", [examId]);
      if (qRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không thể công bố đề thi chưa có câu hỏi nào. Vui lòng thêm câu hỏi trước khi công bố.",
        });
      }

      for (const q of qRows) {
        const [cRows] = await pool.query("SELECT id, is_correct FROM choices WHERE question_id = ?", [q.id]);
        if (cRows.length !== 4) {
          return res.status(400).json({
            success: false,
            message: `Câu hỏi ID ${q.id} không đủ 4 lựa chọn đáp án. Không thể công bố đề.`,
          });
        }
        const correctCount = cRows.filter((c) => c.is_correct === 1 || c.is_correct === true).length;
        if (correctCount !== 1) {
          return res.status(400).json({
            success: false,
            message: `Câu hỏi ID ${q.id} phải có chính xác 1 đáp án đúng (hiện có ${correctCount}). Không thể công bố đề.`,
          });
        }
      }
    }

    let categoryId = currentExam.category_id;
    if (category_id !== undefined) {
      if (category_id === null || category_id === "" || category_id === 0) {
        categoryId = null;
      } else {
        const parsedCat = parseInt(category_id, 10);
        if (!isNaN(parsedCat)) {
          const [catCheck] = await pool.query("SELECT id FROM categories WHERE id = ?", [parsedCat]);
          if (catCheck.length === 0) {
            return res.status(400).json({ success: false, message: "Danh mục đã chọn không tồn tại." });
          }
          categoryId = parsedCat;
        }
      }
    }

    const newTitle = title !== undefined ? title.trim() : currentExam.title;
    const newDesc = description !== undefined ? description.trim() : currentExam.description;
    const newDuration = duration_minutes !== undefined ? parseInt(duration_minutes, 10) : currentExam.duration_minutes;
    const newPassing = passing_score !== undefined ? parseFloat(passing_score) : currentExam.passing_score;
    const newStatus = status !== undefined ? status : currentExam.status;

    await pool.query(
      `UPDATE exams 
       SET title = ?, description = ?, category_id = ?, duration_minutes = ?, passing_score = ?, status = ?
       WHERE id = ?`,
      [newTitle, newDesc, categoryId, newDuration, newPassing, newStatus, examId]
    );

    await logAudit({
      action: "UPDATE_EXAM",
      entityType: "exam",
      entityId: examId,
      details: {
        title: newTitle,
        status: newStatus,
        previous_status: currentExam.status,
      },
      status: "success",
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Lưu thay đổi thông tin đề thi thành công.",
      exam: {
        id: examId,
        title: newTitle,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error("[UPDATE_EXAM_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi cập nhật đề thi." });
  }
}

// Xóa đề thi dạng Soft Delete (Admin only)
// Không xóa câu hỏi, không xóa snapshot/lịch sử; thí sinh không thấy và không nhận lượt thi mới
async function deleteExam(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);

    const [existing] = await pool.query("SELECT id, title, deleted_at FROM exams WHERE id = ?", [examId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đề thi." });
    }

    if (existing[0].deleted_at !== null) {
      return res.status(400).json({ success: false, message: "Đề thi này đã nằm trong thùng rác." });
    }

    await pool.query("UPDATE exams SET deleted_at = NOW() WHERE id = ?", [examId]);

    await logAudit({
      action: "SOFT_DELETE_EXAM",
      entityType: "exam",
      entityId: examId,
      details: { title: existing[0].title },
      status: "success",
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Đã chuyển đề thi "${existing[0].title}" vào Thùng rác thành công.`,
    });
  } catch (error) {
    console.error("[DELETE_EXAM_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi xóa đề thi." });
  }
}

// Khôi phục đề thi từ Thùng rác về trạng thái nháp 'draft' (Admin only)
async function restoreExam(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);

    const [existing] = await pool.query("SELECT id, title, deleted_at FROM exams WHERE id = ?", [examId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đề thi." });
    }

    if (existing[0].deleted_at === null) {
      return res.status(400).json({ success: false, message: "Đề thi này không nằm trong thùng rác." });
    }

    // Khôi phục về nháp để admin kiểm tra lại trước khi công bố
    await pool.query("UPDATE exams SET deleted_at = NULL, status = 'draft' WHERE id = ?", [examId]);

    await logAudit({
      action: "RESTORE_EXAM",
      entityType: "exam",
      entityId: examId,
      details: { title: existing[0].title, restored_status: "draft" },
      status: "success",
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Đã khôi phục đề thi "${existing[0].title}" về trạng thái Nháp thành công.`,
    });
  } catch (error) {
    console.error("[RESTORE_EXAM_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi khôi phục đề thi." });
  }
}

// Thêm câu hỏi và 4 lựa chọn (Admin only)
async function addQuestion(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const examId = parseInt(req.params.id, 10);
    const { question_text, explanation, choices } = req.body;

    if (!question_text || !Array.isArray(choices) || choices.length !== 4) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Mỗi câu hỏi phải có nội dung và đúng 4 lựa chọn đáp án.",
      });
    }

    const correctCount = choices.filter((c) => c.is_correct === true || c.is_correct === 1).length;
    if (correctCount !== 1) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Mỗi câu hỏi phải có chính xác 1 đáp án đúng.",
      });
    }

    const [cnt] = await connection.query("SELECT COUNT(*) AS total FROM questions WHERE exam_id = ?", [examId]);
    const nextOrder = (cnt[0].total || 0) + 1;

    const [qRes] = await connection.query(
      "INSERT INTO questions (exam_id, question_text, explanation, order_num) VALUES (?, ?, ?, ?)",
      [examId, question_text, explanation || "", nextOrder]
    );
    const questionId = qRes.insertId;

    for (let i = 0; i < choices.length; i++) {
      const c = choices[i];
      await connection.query(
        "INSERT INTO choices (question_id, choice_text, is_correct, order_num) VALUES (?, ?, ?, ?)",
        [questionId, c.choice_text, c.is_correct ? 1 : 0, i + 1]
      );
    }

    await connection.commit();

    await logAudit({
      action: "ADD_QUESTION",
      entityType: "question",
      entityId: questionId,
      details: { exam_id: examId, question_text: question_text.substring(0, 80) },
      status: "success",
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Thêm câu hỏi và 4 đáp án thành công.",
      questionId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("[ADD_QUESTION_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi thêm câu hỏi." });
  } finally {
    connection.release();
  }
}

// Xóa câu hỏi (Admin only)
async function deleteQuestion(req, res) {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    await pool.query("DELETE FROM questions WHERE id = ?", [questionId]);

    await logAudit({
      action: "DELETE_QUESTION",
      entityType: "question",
      entityId: questionId,
      status: "success",
      req,
    });

    return res.status(200).json({ success: true, message: "Đã xóa câu hỏi." });
  } catch (error) {
    console.error("[DELETE_QUESTION_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi xóa câu hỏi." });
  }
}

// Xem danh sách kết quả lượt thi của đề (Admin only)
async function getExamResults(req, res) {
  try {
    const examId = parseInt(req.params.id, 10);
    const [attempts] = await pool.query(
      `SELECT a.id, a.user_id, u.full_name, u.username, u.email,
              a.started_at, a.due_at, a.submitted_at, a.status,
              a.score, a.correct_count, a.total_questions, a.is_passed
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       WHERE a.exam_id = ?
       ORDER BY a.started_at DESC`,
      [examId]
    );

    return res.status(200).json({ success: true, attempts });
  } catch (error) {
    console.error("[GET_EXAM_RESULTS_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi lấy danh sách kết quả lượt thi." });
  }
}

module.exports = {
  getExams,
  getTrashExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  restoreExam,
  addQuestion,
  deleteQuestion,
  getExamResults,
};
