const test = require("node:test");
const assert = require("node:assert");
const http = require("http");

function req(options, data) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body || "{}") });
        } catch(e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    r.on("error", reject);
    if (data) r.write(JSON.stringify(data));
    r.end();
  });
}

let studentCookie = "";
let studentCsrf = "";
let adminCookie = "";
let adminCsrf = "";

test("1. Chuẩn bị phiên xác thực cho Thí sinh và Admin", async () => {
  const sRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json" }
  }, { login: "student1", password: "Student@123456" });
  assert.strictEqual(sRes.status, 200);
  studentCookie = sRes.headers["set-cookie"].map(c => c.split(";")[0]).join("; ");
  studentCsrf = sRes.body.csrfToken;

  const aRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json" }
  }, { login: "admin", password: "Admin@123456" });
  assert.strictEqual(aRes.status, 200);
  adminCookie = aRes.headers["set-cookie"].map(c => c.split(";")[0]).join("; ");
  adminCsrf = aRes.body.csrfToken;
});

test("2. Kiểm tra API GET /api/categories trả về đủ 5 danh mục", async () => {
  const res = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/categories", method: "GET"
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.categories.length, 5);
  const slugs = res.body.categories.map(c => c.slug);
  assert.ok(slugs.includes("trien-khai-quan-tri-he-thong"));
  assert.ok(slugs.includes("an-toan-thong-tin"));
  assert.ok(slugs.includes("mang-may-tinh"));
  assert.ok(slugs.includes("co-so-du-lieu"));
  assert.ok(slugs.includes("lap-trinh-web"));
});

test("3. Lọc đề thi theo Danh mục và Tìm kiếm theo từ khóa", async () => {
  // Lọc category lap-trinh-web
  const catRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/exams?category=lap-trinh-web", method: "GET",
    headers: { "Cookie": studentCookie }
  });
  assert.strictEqual(catRes.status, 200);
  assert.strictEqual(catRes.body.exams.length, 3, "Danh mục Lập trình Web phải có đúng 3 bài thi");
  for (const e of catRes.body.exams) {
    assert.strictEqual(e.category_slug, "lap-trinh-web");
  }

  // Tìm kiếm theo từ khóa
  const searchRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/exams?search=" + encodeURIComponent("Docker"), method: "GET",
    headers: { "Cookie": studentCookie }
  });
  assert.strictEqual(searchRes.status, 200);
  assert.ok(searchRes.body.exams.length >= 1);
  assert.ok(searchRes.body.exams.some(e => e.title.includes("Docker")));

  // Tìm kiếm không tồn tại
  const emptyRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/exams?search=tu_khoa_khong_ton_tai_xyz", method: "GET",
    headers: { "Cookie": studentCookie }
  });
  assert.strictEqual(emptyRes.status, 200);
  assert.strictEqual(emptyRes.body.exams.length, 0, "Tìm từ khóa không tồn tại phải trả về mảng rỗng");
});

test("4. Ràng buộc bảo vệ: Không cho xóa danh mục đang có đề thi", async () => {
  const delRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/categories/1", method: "DELETE",
    headers: { "Cookie": adminCookie, "x-csrf-token": adminCsrf, "Content-Type": "application/json" }
  });
  assert.strictEqual(delRes.status, 400, "Xóa danh mục đang có đề phải bị từ chối 400");
  assert.ok(delRes.body.message.includes("Không thể xóa danh mục"), "Thông báo lỗi phải rõ ràng lý do có đề thi");
});

test("5. Làm bài thi trong danh mục mới: Bắt đầu, Autosave, F5 và Chấm điểm", async () => {
  // Bắt đầu thi Đề 53 (Node.js, Express & REST API)
  const startRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/attempts/start/53", method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
  });
  assert.ok([200, 201].includes(startRes.status));
  const attemptId = startRes.body.attemptId;

  // Kiểm tra chi tiết và hạn nộp (không bị lỗi hết giờ)
  const detailRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}`, method: "GET",
    headers: { "Cookie": studentCookie }
  });
  assert.strictEqual(detailRes.status, 200);
  assert.strictEqual(detailRes.body.attempt.status, "in_progress");
  assert.strictEqual(detailRes.body.questions.length, 10);

  const dueTime = new Date(detailRes.body.attempt.due_at).getTime();
  const now = new Date(detailRes.body.attempt.server_now).getTime();
  assert.ok(dueTime > now, "due_at phải lớn hơn server_now (chưa hết giờ)");

  // Autosave câu trả lời
  const saveRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}/answer`, method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
  }, { question_id: 5301, selected_choice_id: 53011 });
  assert.strictEqual(saveRes.status, 200);

  // Tải lại (F5): Kiểm tra đáp án đã lưu
  const reloadRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}`, method: "GET",
    headers: { "Cookie": studentCookie }
  });
  const q5301 = reloadRes.body.questions.find(q => q.id === 5301);
  assert.strictEqual(q5301.selected_choice_id, 53011, "F5 phải khôi phục chính xác đáp án đã lưu");

  // Nộp bài thi
  const submitRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}/submit`, method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
  });
  assert.strictEqual(submitRes.status, 200);
  assert.ok(typeof submitRes.body.score === "number", "Phải có điểm số hợp lệ");
});

