// Custom Prometheus metrics cho Quiz Exam System mà không phụ thuộc gói bên ngoài nếu cần,
// hoặc cung cấp endpoint chuẩn định dạng Prometheus exposition text.

let requestCount = 0;
let errorCount = 0;
const statusCodes = {};
const routeLatencies = [];

function recordMetrics(req, res, responseTimeMs) {
  requestCount++;
  const status = res.statusCode;
  statusCodes[status] = (statusCodes[status] || 0) + 1;
  if (status >= 400) {
    errorCount++;
  }
}

function getPrometheusMetricsText() {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  let text = `# HELP app_uptime_seconds Thời gian máy chủ Node.js đã chạy (uptime)
# TYPE app_uptime_seconds gauge
app_uptime_seconds ${uptime.toFixed(2)}

# HELP app_requests_total Tổng số lượt HTTP request tiếp nhận
# TYPE app_requests_total counter
app_requests_total ${requestCount}

# HELP app_http_errors_total Tổng số request trả về mã lỗi HTTP (>= 400)
# TYPE app_http_errors_total counter
app_http_errors_total ${errorCount}

# HELP app_nodejs_heap_used_bytes Bộ nhớ Heap đang sử dụng
# TYPE app_nodejs_heap_used_bytes gauge
app_nodejs_heap_used_bytes ${memory.heapUsed}

# HELP app_nodejs_heap_total_bytes Tổng bộ nhớ Heap cấp phát
# TYPE app_nodejs_heap_total_bytes gauge
app_nodejs_heap_total_bytes ${memory.heapTotal}

# HELP app_nodejs_rss_bytes Dung lượng RSS (Resident Set Size)
# TYPE app_nodejs_rss_bytes gauge
app_nodejs_rss_bytes ${memory.rss}
`;

  for (const [code, count] of Object.entries(statusCodes)) {
    text += `app_http_requests_by_status{status="${code}"} ${count}\n`;
  }

  return text;
}

module.exports = {
  recordMetrics,
  getPrometheusMetricsText,
};
