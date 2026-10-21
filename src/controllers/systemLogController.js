const { pool } = require("../config/database");

/**
 * Controller quản lý System Logs (Audit Logs & Loki Proxy) dành riêng cho Admin
 */

// A. Lấy danh sách Nhật ký hoạt động (Audit Logs) có phân trang và bộ lọc
async function getAuditLogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { action, status, search, from_date, to_date } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (action && typeof action === "string" && action.trim()) {
      whereClause += " AND action = ?";
      params.push(action.trim());
    }

    if (status && (status === "success" || status === "failure")) {
      whereClause += " AND status = ?";
      params.push(status);
    }

    if (search && typeof search === "string" && search.trim()) {
      whereClause += " AND (username LIKE ? OR entity_type LIKE ? OR details LIKE ?)";
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    if (from_date && typeof from_date === "string" && from_date.trim()) {
      whereClause += " AND created_at >= ?";
      params.push(from_date.trim());
    }

    if (to_date && typeof to_date === "string" && to_date.trim()) {
      whereClause += " AND created_at <= ?";
      params.push(to_date.trim() + " 23:59:59");
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_logs ${whereClause}`,
      params
    );
    const total = countRows[0].total || 0;

    const [logs] = await pool.query(
      `SELECT id, user_id, username, role, action, entity_type, entity_id, details, status, ip_address, user_agent, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[GET_AUDIT_LOGS_ERROR]", error.message);
    return res.status(500).json({ success: false, message: "Lỗi tải nhật ký hoạt động." });
  }
}

// B. Truy vấn Log kỹ thuật từ Loki an toàn qua mạng nội bộ
// Backend cố định nhãn project="quiz-exam-system" và whitelist service app/nginx
async function getLokiLogs(req, res) {
  try {
    const { service, level, search, limit: reqLimit, hours } = req.query;

    // Whitelist service hợp lệ: "app", "nginx", hoặc cả hai
    let targetService = "all";
    if (service === "app" || service === "nginx") {
      targetService = service;
    }

    // Xây dựng selector LogQL an toàn cố định nhãn project="quiz-exam-system"
    let logql = '{project="quiz-exam-system"';
    if (targetService !== "all") {
      logql += `,service="${targetService}"`;
    }
    logql += "}";

    // Bổ sung lọc mức lỗi (status >= 400 hoặc 500)
    if (level === "error") {
      logql += " | json | status >= 400";
    } else if (level === "5xx") {
      logql += " | json | status >= 500";
    } else if (level === "4xx") {
      logql += " | json | status >= 400 and status < 500";
    }

    // Bổ sung từ khóa tìm kiếm (lọc dòng văn bản, escape ký tự đặc biệt)
    if (search && typeof search === "string" && search.trim()) {
      const sanitizedKw = search.trim().replace(/["\\]/g, "");
      if (sanitizedKw.length > 0 && sanitizedKw.length <= 50) {
        logql += ` |= "${sanitizedKw}"`;
      }
    }

    const limit = Math.min(200, Math.max(10, parseInt(reqLimit, 10) || 50));
    const h = Math.min(24, Math.max(1, parseInt(hours, 10) || 2));

    const nowNs = Date.now() * 1e6;
    const startNs = (Date.now() - h * 3600 * 1000) * 1e6;

    const lokiHost = process.env.LOKI_HOST || "loki";
    const lokiPort = process.env.LOKI_PORT || "3100";
    const lokiUrl = `http://${lokiHost}:${lokiPort}/loki/api/v1/query_range?query=${encodeURIComponent(logql)}&limit=${limit}&start=${startNs}&end=${nowNs}&direction=backward`;

    // Gọi Loki với timeout 5 giây
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(lokiUrl, { signal: controller.signal });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      return res.status(200).json({
        success: true,
        available: false,
        message: "Máy chủ lưu trữ Log (Loki) hiện chưa sẵn sàng hoặc không phản hồi.",
        logs: [],
        queryUsed: logql,
      });
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `Loki trả về mã phản hồi HTTP ${response.status}`,
        logs: [],
        queryUsed: logql,
      });
    }

    const resultJson = await response.json();
    const streams = resultJson.data?.result || [];

    // Tập hợp và làm sạch log (Mask secret/cookie nếu vô tình có trong log)
    const logEntries = [];
    for (const stream of streams) {
      const labels = stream.stream || {};
      const values = stream.values || []; // [ [nanoTimestampStr, lineStr], ... ]

      for (const [timestampNs, rawLine] of values) {
        // Che các dữ liệu nhạy cảm
        let cleanLine = rawLine
          .replace(/(["']?password["']?\s*[:=]\s*["'])([^"']+)(["'])/gi, '$1***MASKED***$3')
          .replace(/(["']?token["']?\s*[:=]\s*["'])([^"']+)(["'])/gi, '$1***MASKED***$3')
          .replace(/(["']?cookie["']?\s*[:=]\s*["'])([^"']+)(["'])/gi, '$1***MASKED***$3');

        logEntries.push({
          timestamp: new Date(parseInt(timestampNs.substring(0, 13), 10)).toISOString(),
          timestampNs,
          service: labels.service || "unknown",
          project: labels.project || "quiz-exam-system",
          line: cleanLine,
        });
      }
    }

    // Sắp xếp giảm dần theo thời gian (mới nhất lên đầu)
    logEntries.sort((a, b) => (b.timestampNs > a.timestampNs ? 1 : -1));

    return res.status(200).json({
      success: true,
      available: true,
      total: logEntries.length,
      queryUsed: logql,
      logs: logEntries.slice(0, limit),
    });
  } catch (error) {
    console.error("[GET_LOKI_LOGS_ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "Lỗi nội bộ khi truy vấn nhật ký kỹ thuật.",
    });
  }
}

module.exports = {
  getAuditLogs,
  getLokiLogs,
};

