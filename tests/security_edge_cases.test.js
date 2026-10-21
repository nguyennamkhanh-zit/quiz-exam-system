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
let student2Cookie = "";
let student2Csrf = "";
let adminCookie = "";
let adminCsrf = "";
let attemptId = null;

test("1. Login lấy phiên xác thực của Student 1, Student 2, Admin", async () => {
  // Login Student 1
  const s1 = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json" }
  }, { login: "student1", password: "Student@123456" });
  assert.strictEqual(s1.status, 200);
  studentCookie = s1.headers["set-cookie"].map(c => c.split(";")[0]).join("; ");
  studentCsrf = s1.body.csrfToken;

  // Login Student 2
  const s2 = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json" }
  }, { login: "student2", password: "Student@123456" });
  assert.strictEqual(s2.status, 200);
  student2Cookie = s2.headers["set-cookie"].map(c => c.split(";")[0]).join("; ");
  student2Csrf = s2.body.csrfToken;

  // Login Admin
  const adm = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json" }
  }, { login: "admin", password: "Admin@123456" });
  assert.strictEqual(adm.status, 200);
  adminCookie = adm.headers["set-cookie"].map(c => c.split(";")[0]).join("; ");
  adminCsrf = adm.body.csrfToken;
});

test("2. Phân quyền: Thí sinh gọi API Admin bị từ chối 403 Forbidden", async () => {
  // Student cố tạo đề thi
  const res = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/exams", method: "POST",
    headers: {
      "Cookie": studentCookie,
      "x-csrf-token": studentCsrf,
      "Content-Type": "application/json"
    }
  }, { title: "Hack Exam", duration_minutes: 10 });
  assert.strictEqual(res.status, 403, "Thí sinh không được phép tạo đề");
});

test("3. CSRF Protection: Thiếu hoặc sai CSRF token bị từ chối 403 Forbidden", async () => {
  // Không có header x-csrf-token
  const resNoCsrf = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/attempts/start/2", method: "POST",
    headers: { "Cookie": studentCookie, "Content-Type": "application/json" }
  });
  assert.strictEqual(resNoCsrf.status, 403, "Thiếu CSRF phải bị từ chối");

  // Sai header x-csrf-token
  const resBadCsrf = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/attempts/start/2", method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": "bad-token-value-1234", "Content-Type": "application/json" }
  });
  assert.strictEqual(resBadCsrf.status, 403, "Sai CSRF phải bị từ chối");
});

test("4. Thí sinh bắt đầu thi Đề 2 & Kiểm tra Thí sinh A không thể xem/sửa bài thi của Thí sinh B", async () => {
  // Student 1 start exam 2
  const startRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/attempts/start/2", method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
  });
  assert.strictEqual(startRes.status, 201);
  attemptId = startRes.body.attemptId;

  // Student 2 cố xem bài của Student 1
  const viewRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}`, method: "GET",
    headers: { "Cookie": student2Cookie }
  });
  assert.strictEqual(viewRes.status, 403, "Student 2 không được đọc bài Student 1");

  // Student 2 cố sửa đáp án bài của Student 1
  const editRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}/answer`, method: "POST",
    headers: { "Cookie": student2Cookie, "x-csrf-token": student2Csrf, "Content-Type": "application/json" }
  }, { question_id: 201, selected_choice_id: 2011 });
  assert.strictEqual(editRes.status, 403, "Student 2 không được sửa đáp án bài Student 1");

  // Student 2 cố nộp bài của Student 1
  const subRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}/submit`, method: "POST",
    headers: { "Cookie": student2Cookie, "x-csrf-token": student2Csrf, "Content-Type": "application/json" }
  });
  assert.strictEqual(subRes.status, 403, "Student 2 không được nộp bài Student 1");
});

test("5. Tải lại trang (Refresh / F5): Khôi phục tiến độ đáp án đã chọn và thời hạn nộp", async () => {
  // Student 1 chọn câu trả lời
  await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}/answer`, method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
  }, { question_id: 201, selected_choice_id: 2011 });

  // Tải lại chi tiết lượt thi
  const reloadRes = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}`, method: "GET",
    headers: { "Cookie": studentCookie }
  });
  assert.strictEqual(reloadRes.status, 200);
  const q201 = reloadRes.body.questions.find(q => q.id === 201);
  assert.strictEqual(q201.selected_choice_id, 2011, "Tiến độ câu trả lời phải được khôi phục chính xác");
  assert.ok(reloadRes.body.attempt.due_at, "Hạn nộp due_at phải được bảo lưu");
});

test("6. Nộp bài đồng thời (Concurrency Test): Gửi song song nhiều request nộp bài cùng lúc", async () => {
  // Gửi đồng thời 5 request nộp bài
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(req({
      hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}/submit`, method: "POST",
      headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
    }));
  }

  const results = await Promise.all(promises);
  const scores = results.map(r => r.body.score);
  // Tất cả request đều thành công HTTP 200 và có điểm số đồng nhất
  for (const r of results) {
    assert.strictEqual(r.status, 200, "Tất cả request nộp bài phải trả về 200");
  }
  const firstScore = scores[0];
  for (const s of scores) {
    assert.strictEqual(Number(s), Number(firstScore), "Điểm số các request đồng thời phải hoàn toàn nhất quán");
  }
});

test("7. Lượt thi đã nộp: Không nhận chỉnh sửa câu trả lời", async () => {
  const postSubmitAnswer = await req({
    hostname: "127.0.0.1", port: 18095, path: `/api/attempts/${attemptId}/answer`, method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
  }, { question_id: 201, selected_choice_id: 2012 });

  assert.strictEqual(postSubmitAnswer.status, 400, "Đã nộp bài thì không được sửa đáp án");
});

test("8. Đăng xuất: Vô hiệu hóa phiên, thu hồi JWT (token revocation)", async () => {
  // Gửi request với token hợp lệ trước khi logout
  const meBefore = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/me", method: "GET",
    headers: { "Cookie": studentCookie }
  });
  assert.strictEqual(meBefore.status, 200, "Trước khi logout, token phải hợp lệ 200");

  // Thực hiện Logout
  const logoutRes = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/logout", method: "POST",
    headers: { "Cookie": studentCookie, "x-csrf-token": studentCsrf, "Content-Type": "application/json" }
  });
  assert.strictEqual(logoutRes.status, 200);

  // Cookie auth_token trong response header bị clear (expires trong quá khứ hoặc trống)
  const setCookies = logoutRes.headers["set-cookie"];
  const clearedAuth = setCookies.some(c => c.includes("auth_token=;") || c.includes("Expires="));
  assert.ok(clearedAuth, "Cookie đăng nhập phải bị xóa");

  // Kiểm tra quan trọng: Cố tình gửi lại token/cookie cũ đã lưu trước đó lên server
  const meAfter = await req({
    hostname: "127.0.0.1", port: 18095, path: "/api/auth/me", method: "GET",
    headers: { "Cookie": studentCookie }
  });
  assert.strictEqual(meAfter.status, 401, "Sau khi logout, token cũ phải bị từ chối 401 Unauthorized do token revocation");
});
