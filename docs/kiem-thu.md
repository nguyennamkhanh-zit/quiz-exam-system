# Kế Hoạch & Kết Quả Kiểm Thử Hệ Thống (Test Matrix)

## 1. Phương pháp Kiểm Thử
- **Unit Test tự động:** Sử dụng Node.js Test Runner built-in (`node --test`) kiểm tra các hàm mã hóa bảo mật, băm mật khẩu, tạo/giải mã token JWT, CSRF và thuật toán chấm điểm tự động.
- **Integration & Security Test:** Kiểm tra luồng gọi API, phân quyền vai trò (Admin vs Thí sinh), xác thực cookie, phòng chống nộp bài lặp và kiểm tra response header qua Nginx.

## 2. Ma Trận Kiểm Thử Chi Tiết (Test Cases Matrix)

| STT | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào / Thao Tác | Kết Quả Kỳ Vọng | Trạng Thái Thực Tế |
|---|---|---|---|---|
| **TC-01** | Băm mật khẩu an toàn | Mật khẩu plain-text "Student@123456" | Sinh chuỗi băm chuẩn `$2b$10$...`, `bcrypt.compare` khớp đúng, sai pass trả về false | **PASS** |
| **TC-02** | Tạo & Kiểm tra Token JWT | Payload user `{id: 10, role: "student"}` | Token giải mã đúng thông tin; Token giả mạo bị từ chối (`null`) | **PASS** |
| **TC-03** | Khởi tạo CSRF Token | Gọi `generateCsrfToken()` | Chuỗi hex ngẫu nhiên 64 ký tự, tính duy nhất cao | **PASS** |
| **TC-04** | Thuật toán chấm điểm thang 10 | 8/10 câu đúng, 7/10 câu đúng, 0/10 câu đúng | Điểm số tính chính xác tương ứng 8.00, 7.00, 0.00; Đánh giá Đạt khi >= passing_score | **PASS** |
| **TC-05** | Làm tròn điểm lẻ | Đề 15 câu, làm đúng 11 câu | Điểm làm tròn chính xác 2 chữ số thập phân (7.33) | **PASS** |
| **TC-06** | Xử lý hết giờ làm bài | Thời gian hiện tại vượt mốc `due_at` trên server | Lượt thi bị khóa tự động, chuyển trạng thái sang `timed_out` | **PASS** |
| **TC-07** | Đăng ký tài khoản mới | Gửi thông tin hợp lệ | Tạo tài khoản thành công với vai trò luôn là `student`, mã HTTP 201 | Sẵn sàng test tích hợp |
| **TC-08** | Đăng ký trùng email/username | Trùng tài khoản `student1` | Bị từ chối với mã HTTP 409 Conflict | Sẵn sàng test tích hợp |
| **TC-09** | Thí sinh không thể tự chọn Admin | Gửi request đăng ký có trường `role: "admin"` | Backend bỏ qua trường role từ client, tài khoản vẫn là `student` | Sẵn sàng test tích hợp |
| **TC-10** | Đăng nhập sai mật khẩu | Nhập sai mật khẩu | Bị từ chối với mã HTTP 401 Unauthorized | Sẵn sàng test tích hợp |
| **TC-11** | Bảo vệ API làm bài | Gọi `GET /api/attempts/:id` khi đang làm bài | Dữ liệu trả về không chứa cờ `is_correct` hoặc `explanation` | Sẵn sàng test tích hợp |
| **TC-12** | Lưu tiến độ làm bài (Auto-save) | Gửi `POST /api/attempts/:id/answer` | Câu trả lời được cập nhật vào database, tải lại trang vẫn giữ nguyên | Sẵn sàng test tích hợp |
| **TC-13** | Phòng chống nộp bài lặp | Gửi 2 request nộp bài liên tiếp | Database transaction xử lý an toàn, điểm số không bị ghi đè hay nhân đôi | Sẵn sàng test tích hợp |
| **TC-14** | Thí sinh xem bài người khác | Thí sinh A truy cập ID lượt thi của thí sinh B | Bị chặn với mã HTTP 403 Forbidden | Sẵn sàng test tích hợp |
| **TC-15** | Bảo đảm tính bất biến khi sửa đề | Admin sửa nội dung câu hỏi sau khi thí sinh đã thi | Lượt thi dựa trên `exam_snapshot_json`, không thay đổi đề cũ | Sẵn sàng test tích hợp |
| **TC-16** | Nginx Security Headers | Gửi HTTP GET tới cổng 18095 | Có mặt đầy đủ `X-Frame-Options`, `X-Content-Type-Options`, `CSP`, ẩn server version | Sẵn sàng test tích hợp |
