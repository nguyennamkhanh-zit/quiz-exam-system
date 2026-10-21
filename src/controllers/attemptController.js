const { pool } = require("../config/database");
const { toIsoUtcString } = require("../utils/helpers");

// Thí sinh bắt đầu một lượt thi mới (Hoặc lấy lại lượt thi in_progress nếu chưa hết hạn)
async function startAttempt(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const examId = parseInt(req.params.examId, 10);

    // Kiểm tra đề thi tồn tại, đã published và CHƯA BỊ XÓA (deleted_at IS NULL)
    const [exams] = await connection.query(
      "SELECT * FROM exams WHERE id = ? AND status = 'published' AND deleted_at IS NULL",
      [examId]
    );

    if (exams.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Đề thi không tồn tại, chưa được công bố hoặc đã bị đóng.",
      });
    }

    const exam = exams[0];

    // Kiểm tra xem thí sinh có lượt thi nào đang dở dang (in_progress) không
    const [existingAttempts] = await connection.query(
      "SELECT * FROM attempts WHERE user_id = ? AND exam_id = ? AND status = 'in_progress' ORDER BY id DESC LIMIT 1",
      [userId, examId]
    );

    const now = new Date();

    if (existingAttempts.length > 0) {
      const activeAttempt = existingAttempts[0];
      const dueTime = new Date(toIsoUtcString(activeAttempt.due_at));

      // Nếu còn hạn: trả về tiếp tục làm bài
      if (now < dueTime) {
        await connection.commit();
        return res.status(200).json({
          success: true,
          message: "Tiếp tục lượt thi đang thực hiện.",
          attemptId: activeAttempt.id,
          due_at: toIsoUtcString(activeAttempt.due_at),
          started_at: toIsoUtcString(activeAttempt.started_at),
        });
      } else {
        // Nếu đã quá hạn: tự động chốt bài và đóng lượt thi này
        await finalizeAttemptInternal(connection, activeAttempt.id, "timed_out");
      }
    }

    // Lấy toàn bộ câu hỏi và đáp án để chụp Snapshot
    const [questions] = await connection.query(
      "SELECT id, question_text, explanation, order_num FROM questions WHERE exam_id = ? ORDER BY order_num ASC",
      [examId]
    );

    if (questions.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Đề thi hiện chưa có câu hỏi nào, không thể bắt đầu thi.",
      });
    }

    for (const q of questions) {
      const [choices] = await connection.query(
        "SELECT id, choice_text, is_correct, order_num FROM choices WHERE question_id = ? ORDER BY order_num ASC",
        [q.id]
      );
      q.choices = choices;
    }

    // Thời gian kết thúc = now + duration_minutes
    const startedAt = new Date();
    const dueAt = new Date(startedAt.getTime() + exam.duration_minutes * 60 * 1000);

    // Chuyển sang định dạng MySQL datetime YYYY-MM-DD HH:mm:ss UTC
    const startedAtStr = startedAt.toISOString().slice(0, 19).replace("T", " ");
    const dueAtStr = dueAt.toISOString().slice(0, 19).replace("T", " ");

    const snapshotJson = JSON.stringify({
      exam: {
        id: exam.id,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        passing_score: exam.passing_score,
      },
      questions,
    });

    const [insertResult] = await connection.query(
      `INSERT INTO attempts (user_id, exam_id, exam_snapshot_json, total_questions, started_at, due_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'in_progress')`,
      [userId, examId, snapshotJson, questions.length, startedAtStr, dueAtStr]
    );

    const attemptId = insertResult.insertId;
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Bắt đầu lượt thi thành công.",
      attemptId,
      due_at: dueAt.toISOString(),
      started_at: startedAt.toISOString(),
      total_questions: questions.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error("[START_ATTEMPT_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi bắt đầu lượt thi." });
  } finally {
    connection.release();
  }
}

// Lấy thông tin bài thi đang làm (TUYỆT ĐỐI KHÔNG TRẢ ĐÁP ÁN ĐÚNG is_correct)
async function getAttemptDetails(req, res) {
  try {
    const attemptId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const [attempts] = await pool.query("SELECT * FROM attempts WHERE id = ?", [attemptId]);
    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lượt thi." });
    }

    const attempt = attempts[0];
    // Bảo vệ quyền: Chỉ chính thí sinh hoặc Admin mới được xem
    if (attempt.user_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem bài thi này." });
    }

    const snapshot = JSON.parse(attempt.exam_snapshot_json);

    // Lấy các câu trả lời đã lưu trước đó của thí sinh
    const [savedAnswers] = await pool.query(
      "SELECT question_id, selected_choice_id FROM attempt_answers WHERE attempt_id = ?",
      [attemptId]
    );

    const answerMap = {};
    for (const ans of savedAnswers) {
      answerMap[ans.question_id] = ans.selected_choice_id;
    }

    // Xóa trường is_correct và explanation khỏi snapshot trước khi gửi về client khi đang làm bài
    const sanitizedQuestions = snapshot.questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      order_num: q.order_num,
      selected_choice_id: answerMap[q.id] || null,
      choices: q.choices.map((c) => ({
        id: c.id,
        choice_text: c.choice_text,
        order_num: c.order_num,
        // TUYỆT ĐỐI KHÔNG BỎ is_correct VÀO ĐÂY
      })),
    }));

    return res.status(200).json({
      success: true,
      attempt: {
        id: attempt.id,
        exam_id: attempt.exam_id,
        exam_title: snapshot.exam.title,
        status: attempt.status,
        started_at: toIsoUtcString(attempt.started_at),
        due_at: toIsoUtcString(attempt.due_at),
        submitted_at: toIsoUtcString(attempt.submitted_at),
        server_now: new Date().toISOString(),
        score: attempt.score !== null ? parseFloat(Number(attempt.score).toFixed(2)) : null,
        total_questions: attempt.total_questions,
        correct_count: attempt.correct_count,
        is_passed: attempt.is_passed,
        passing_score: snapshot.exam.passing_score,
      },
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error("[GET_ATTEMPT_DETAILS_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi tải thông tin bài thi." });
  }
}

// Lưu tiến độ câu trả lời (Save answer real-time)
async function saveAnswer(req, res) {
  try {
    const attemptId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { question_id, selected_choice_id } = req.body;

    const [attempts] = await pool.query(
      "SELECT id, user_id, status, due_at, exam_snapshot_json FROM attempts WHERE id = ?",
      [attemptId]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: "Lượt thi không tồn tại." });
    }

    const attempt = attempts[0];
    if (attempt.user_id !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không thể sửa bài thi của người khác." });
    }

    if (attempt.status !== "in_progress") {
      return res.status(400).json({ success: false, message: "Lượt thi đã kết thúc, không thể đổi câu trả lời." });
    }

    // Kiểm tra hết giờ dựa trên server clock
    const now = new Date();
    const dueTime = new Date(toIsoUtcString(attempt.due_at));
    if (now > dueTime) {
      // Quá hạn: chốt bài ngay
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await finalizeAttemptInternal(connection, attemptId, "timed_out");
        await connection.commit();
      } finally {
        connection.release();
      }
      return res.status(400).json({
        success: false,
        message: "Đã hết thời gian làm bài. Lượt thi đã được tự động kết thúc.",
        is_timed_out: true,
      });
    }

    // Xác thực selected_choice_id có thuộc về question_id không dựa trên snapshot
    const snapshot = JSON.parse(attempt.exam_snapshot_json);
    const targetQ = snapshot.questions.find((q) => q.id === parseInt(question_id, 10));
    if (!targetQ) {
      return res.status(400).json({ success: false, message: "Câu hỏi không hợp lệ trong đề thi này." });
    }

    if (selected_choice_id !== null && selected_choice_id !== undefined) {
      const validChoice = targetQ.choices.some((c) => c.id === parseInt(selected_choice_id, 10));
      if (!validChoice) {
        return res.status(400).json({ success: false, message: "Lựa chọn đáp án không hợp lệ." });
      }
    }

    // Lưu vào bảng attempt_answers (UPSERT)
    await pool.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_choice_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE selected_choice_id = VALUES(selected_choice_id), answered_at = CURRENT_TIMESTAMP`,
      [attemptId, question_id, selected_choice_id || null]
    );

    return res.status(200).json({
      success: true,
      message: "Đã lưu tiến độ câu trả lời.",
      question_id,
      selected_choice_id,
    });
  } catch (error) {
    console.error("[SAVE_ANSWER_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi lưu câu trả lời." });
  }
}

// Nộp bài thi và tự động chấm điểm phía server
async function submitAttempt(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const attemptId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Khóa dòng FOR UPDATE để phòng ngừa gửi request đồng thời (Race condition)
    const [attempts] = await connection.query(
      "SELECT * FROM attempts WHERE id = ? FOR UPDATE",
      [attemptId]
    );

    if (attempts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Không tìm thấy lượt thi." });
    }

    const attempt = attempts[0];
    if (attempt.user_id !== userId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: "Bạn không có quyền nộp bài thi này." });
    }

    // Nếu đã hoàn thành hoặc timed out thì không chấm lại, trả về kết quả đã chốt
    if (attempt.status !== "in_progress") {
      await connection.commit();
      return res.status(200).json({
        success: true,
        message: "Lượt thi đã được nộp từ trước.",
        score: parseFloat(attempt.score),
        correct_count: attempt.correct_count,
        total_questions: attempt.total_questions,
        is_passed: attempt.is_passed,
        status: attempt.status,
      });
    }

    // Xác định trạng thái kết thúc (completed hay timed_out)
    const now = new Date();
    const dueTime = new Date(toIsoUtcString(attempt.due_at));
    const finalStatus = now > dueTime ? "timed_out" : "completed";

    const result = await finalizeAttemptInternal(connection, attemptId, finalStatus);
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: finalStatus === "timed_out" ? "Bài thi đã tự động nộp do hết giờ." : "Nộp bài thành công!",
      ...result,
    });
  } catch (error) {
    await connection.rollback();
    console.error("[SUBMIT_ATTEMPT_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi trong quá trình nộp bài." });
  } finally {
    connection.release();
  }
}

// Hàm nội bộ chấm điểm an toàn dùng Snapshot và Transaction
async function finalizeAttemptInternal(connection, attemptId, status) {
  const [rows] = await connection.query("SELECT * FROM attempts WHERE id = ?", [attemptId]);
  const attempt = rows[0];

  const snapshot = JSON.parse(attempt.exam_snapshot_json);
  const questions = snapshot.questions;
  const totalQuestions = questions.length;

  // Lấy các câu trả lời đã lưu
  const [savedAnswers] = await connection.query(
    "SELECT question_id, selected_choice_id FROM attempt_answers WHERE attempt_id = ?",
    [attemptId]
  );

  const answerMap = {};
  for (const a of savedAnswers) {
    answerMap[a.question_id] = a.selected_choice_id;
  }

  let correctCount = 0;

  // Chấm điểm từng câu dựa trên snapshot bất biến
  for (const q of questions) {
    const userSelectedChoiceId = answerMap[q.id];
    // Tìm đáp án đúng trong snapshot
    const correctChoice = q.choices.find((c) => c.is_correct === 1 || c.is_correct === true);
    const isCorrect = !!(correctChoice && userSelectedChoiceId && correctChoice.id === userSelectedChoiceId);

    if (isCorrect) {
      correctCount += 1;
    }

    // Cập nhật is_correct vào attempt_answers
    if (userSelectedChoiceId) {
      await connection.query(
        "UPDATE attempt_answers SET is_correct = ? WHERE attempt_id = ? AND question_id = ?",
        [isCorrect ? 1 : 0, attemptId, q.id]
      );
    }
  }

  // Thang điểm 10. Làm tròn 2 chữ số thập phân
  const rawScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 10 : 0;
  const finalScore = Math.round(rawScore * 100) / 100;
  const passingScore = parseFloat(snapshot.exam.passing_score || 5.0);
  const isPassed = finalScore >= passingScore ? 1 : 0;

  const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");

  await connection.query(
    `UPDATE attempts
     SET status = ?, score = ?, correct_count = ?, is_passed = ?, submitted_at = ?
     WHERE id = ?`,
    [status, finalScore, correctCount, isPassed, nowStr, attemptId]
  );

  return {
    score: parseFloat(finalScore.toFixed(2)),
    correct_count: correctCount,
    total_questions: totalQuestions,
    is_passed: isPassed === 1,
    status,
    submitted_at: nowStr,
  };
}

// Lấy lịch sử tất cả các lượt thi của thí sinh đang đăng nhập
async function getMyAttempts(req, res) {
  try {
    const userId = req.user.id;
    const [attempts] = await pool.query(
      `SELECT a.id, a.exam_id, e.title AS exam_title, e.passing_score,
              a.started_at, a.due_at, a.submitted_at, a.status,
              a.score, a.correct_count, a.total_questions, a.is_passed
       FROM attempts a
       JOIN exams e ON a.exam_id = e.id
       WHERE a.user_id = ?
       ORDER BY a.started_at DESC`,
      [userId]
    );

    const formattedAttempts = attempts.map((a) => ({
      ...a,
      started_at: toIsoUtcString(a.started_at),
      due_at: toIsoUtcString(a.due_at),
      submitted_at: toIsoUtcString(a.submitted_at),
    }));

    return res.status(200).json({ success: true, attempts: formattedAttempts });
  } catch (error) {
    console.error("[GET_MY_ATTEMPTS_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi lấy lịch sử thi." });
  }
}

// Xem lại kết quả chi tiết kèm giải thích sau khi đã nộp bài
async function getAttemptReview(req, res) {
  try {
    const attemptId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const [attempts] = await pool.query("SELECT * FROM attempts WHERE id = ?", [attemptId]);
    if (attempts.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lượt thi." });
    }

    const attempt = attempts[0];
    if (attempt.user_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem bài thi này." });
    }

    if (attempt.status === "in_progress") {
      return res.status(400).json({ success: false, message: "Lượt thi đang diễn ra, chưa thể xem đáp án." });
    }

    const snapshot = JSON.parse(attempt.exam_snapshot_json);

    // Lấy câu trả lời của thí sinh
    const [answers] = await pool.query(
      "SELECT question_id, selected_choice_id, is_correct FROM attempt_answers WHERE attempt_id = ?",
      [attemptId]
    );

    const ansMap = {};
    for (const a of answers) {
      ansMap[a.question_id] = {
        selected_choice_id: a.selected_choice_id,
        is_correct: a.is_correct === 1,
      };
    }

    // Khi đã hoàn thành, cho phép trả về đáp án đúng và lời giải thích
    const reviewQuestions = snapshot.questions.map((q) => {
      const userAns = ansMap[q.id] || { selected_choice_id: null, is_correct: false };
      return {
        id: q.id,
        question_text: q.question_text,
        explanation: q.explanation,
        order_num: q.order_num,
        user_selected_choice_id: userAns.selected_choice_id,
        is_correct: userAns.is_correct,
        choices: q.choices.map((c) => ({
          id: c.id,
          choice_text: c.choice_text,
          order_num: c.order_num,
          is_correct: c.is_correct === 1 || c.is_correct === true,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      attempt: {
        id: attempt.id,
        exam_id: attempt.exam_id,
        exam_title: snapshot.exam.title,
        status: attempt.status,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        score: parseFloat(attempt.score),
        correct_count: attempt.correct_count,
        total_questions: attempt.total_questions,
        is_passed: attempt.is_passed === 1,
        passing_score: snapshot.exam.passing_score,
      },
      questions: reviewQuestions,
    });
  } catch (error) {
    console.error("[GET_ATTEMPT_REVIEW_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi tải kết quả chi tiết." });
  }
}

module.exports = {
  startAttempt,
  getAttemptDetails,
  saveAnswer,
  submitAttempt,
  getMyAttempts,
  getAttemptReview,
};
