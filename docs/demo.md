# Kịch Bản Demo & Báo Cáo Nghiệm Thu 10 Phút

Tài liệu kịch bản trình diễn hệ thống Quiz Exam System (ĐỀ 35 - TKQT HTPM K23) dành cho buổi nghiệm thu hoặc chấm đồ án thực hành trong vòng 10 phút.

---

## 1. Thông Tin Tài Khoản Thử Nghiệm (Demo Accounts)

| Vai trò | Tên đăng nhập | Email | Mật khẩu mẫu | Quyền hạn & Chức năng |
|---|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `admin@ictu.edu.vn` | `Admin@123456` | Toàn quyền: Quản lý 5 danh mục, tạo đề thi, thêm câu hỏi, kích hoạt/đóng đề thi, xem bảng điểm thí sinh. |
| **Thí sinh 1 (Student)** | `student1` | `student1@ictu.edu.vn` | `Student@123456` | Thí sinh Nguyễn Nam Khánh: Lọc đề theo danh mục, làm bài thi, lưu đáp án tự động, nộp bài, xem lời giải. |
| **Thí sinh 2 (Student)** | `student2` | `student2@ictu.edu.vn` | `Student@123456` | Thí sinh Trần Văn Minh: Dùng để kiểm thử phân quyền thí sinh A không thể xem/sửa bài của thí sinh B. |

---

## 2. Kịch Bản Demo 10 Phút Chi Tiết Từng Bước

### Phút 1 - 2: Khởi động hệ thống & Kiểm tra sức khỏe dịch vụ (Health Check)
1. Mở terminal và kiểm tra trạng thái các dịch vụ:
   ```bash
   docker compose ps
   ```
2. **Minh chứng đạt được:**
   - Đủ **11 containers** chạy ổn định.
   - Các dịch vụ có healthcheck (`app`, `mysql`, `nginx`, `cadvisor`, `prometheus`, `grafana`) đều hiển thị trạng thái `Up (healthy)`.
   - Giám sát log và metrics (`loki`, `promtail`, `mysql-exporter`, `nginx-exporter`, `phpmyadmin`) ở trạng thái `Up`.
3. Chạy bộ kiểm thử tự động của ứng dụng:
   ```bash
   docker compose exec -T app npm test
   docker compose exec -T app npm run test:integration
   ```
   *Kết quả:* 5/5 unit tests và 17/17 integration tests vượt qua thành công (100% PASS).

---

### Phút 3 - 5: Demo Nghiệp vụ Website Thí sinh (Cổng 18098 qua Nginx)
1. Mở trình duyệt truy cập: `http://localhost:18098`
2. Đăng nhập tài khoản thí sinh: `student1` / `Student@123456`.
3. **Trình diễn các tính năng nghiệp vụ:**
   - **Danh mục đề thi:** Hệ thống hiển thị 5 danh mục kiến thức chuyên ngành (Triển khai & Quản trị HTPM, An toàn thông tin, Mạng máy tính, Cơ sở dữ liệu, Lập trình Web). Mỗi danh mục có 3 bài thi chuẩn (tổng cộng 15 bài thi chuẩn, mỗi bài 10 câu hỏi trắc nghiệm).
   - **Lọc và tìm kiếm:** Thử bấm vào từng danh mục (tab) hoặc gõ từ khóa "Docker", "Bảo mật" vào ô tìm kiếm để thấy danh sách bài thi cập nhật tức thì.
   - **Bắt đầu làm bài thi:** Bấm vào bài "Docker & Docker Compose" -> Bắt đầu làm bài.
   - **Đồng hồ đếm ngược server:** Thời gian đếm lùi chính xác theo đồng hồ máy chủ (chuẩn ISO 8601 UTC), không phụ thuộc vào đồng hồ máy client.
   - **Lưu đáp án tự động (Autosave):** Chọn đáp án câu 1, 2, 3 -> Bảng danh sách câu hỏi lập tức đổi màu xanh đánh dấu đã lưu lên máy chủ.
   - **Khôi phục phiên khi tải lại trang (F5):** Bấm F5 tải lại trang -> Tiến độ bài thi, các lựa chọn đã chọn và thời hạn nộp bài được khôi phục nguyên vẹn từ cơ sở dữ liệu.
   - **Nộp bài & Chấm điểm tự động:** Bấm "Nộp bài thi" -> Hệ thống tính điểm tức thì trên thang điểm 10.
   - **Xem lại kết quả & Giải thích:** Màn hình chuyển sang trang kết quả, chỉ rõ câu đúng (màu xanh lá), câu sai (màu đỏ) kèm giải thích chi tiết cho từng câu hỏi.
   - **Lịch sử thi:** Vào tab "Lịch sử thi" để kiểm tra kết quả bài thi vừa hoàn thành đã được ghi nhận vào cơ sở dữ liệu.

---

### Phút 6 - 7: Demo Chức Năng Quản Trị Viên (Admin) & Cơ Sở Dữ Liệu
1. Đăng xuất tài khoản thí sinh, đăng nhập tài khoản quản trị: `admin` / `Admin@123456`.
2. **Trình diễn:**
   - Menu quản trị xuất hiện thêm nút **"Quản lý đề thi"**.
   - Admin xem được tất cả các đề thi ở mọi trạng thái (`published`, `draft`, `closed`).
   - Thử tạo một đề thi mới hoặc sửa trạng thái đề thi.
   - Xem danh sách kết quả bài làm của các thí sinh với điểm số và thời gian nộp bài.
3. Mở công cụ phpMyAdmin tại: `http://localhost:18096`
   - Đăng nhập: Server `mysql`, Username `quiz_app`, Password cấu hình trong `.env`.
   - Xem cấu trúc bảng trong cơ sở dữ liệu **`quiz_exam`**: `categories`, `exams`, `questions`, `choices`, `attempts`, `attempt_answers`.
   - Mở bảng `attempts` để chỉ cho giảng viên thấy trường `exam_snapshot_json`: đề thi được đóng băng tại thời điểm thí sinh bắt đầu thi, đảm bảo việc admin sửa đề gốc sau đó không làm sai lệch bài thi đang diễn ra.

---

### Phút 8 - 9: Demo Giám Sát Prometheus & Grafana Dashboard
1. Truy cập Prometheus tại: `http://localhost:19095/targets`
   - Chỉ ra 5 target đều đang ở trạng thái `UP` màu xanh (`quiz-app`, `mysql`, `nginx`, `cadvisor`, `prometheus`).
2. Mở Grafana Dashboard tại: `http://localhost:18097` (Đăng nhập: `admin` / mật khẩu đã đổi an toàn).
3. Mở Dashboard **"Quiz Exam System - Overview Monitoring"**:
   - Panel trạng thái: MySQL Status (`mysql_up = 1`), Nginx Status (`nginx_up = 1`).
   - Panel lượng truy cập: Total HTTP Requests (`app_requests_total`), Total HTTP Errors (`app_http_errors_total`).
   - Panel tài nguyên: Node.js App Heap Memory.
   - **Panel CPU Container:** Biểu đồ `rate(container_cpu_usage_seconds_total[1m])` từ cAdvisor đo lường CPU của 11 container.
   - **Panel RAM Container:** Biểu đồ `container_memory_working_set_bytes` từ cAdvisor đo lường RAM thực tế chiếm dụng của từng container.
   - Panel Nginx: Nginx Active Connections.
4. **Tạo tải thực tế để thấy biểu đồ nhảy số:**
   - Mở terminal chạy lệnh sinh traffic:
     ```bash
     for i in {1..20}; do curl -s http://localhost:18098/health > /dev/null; done
     ```
   - Quan sát trên Grafana: Số lượng `app_requests_total` tăng lên tức thì.

---

### Phút 10: Demo Log Tập Trung Loki + Promtail qua LogQL & Hardening
1. Trên Grafana, mở menu **Explore** -> Chọn Data Source **Loki**.
2. Thực hiện 3 câu truy vấn LogQL có nhãn `project`:
   - **Query 1 (Xem toàn bộ log hệ thống):**
     ```logql
     {project="quiz-exam-system"}
     ```
     *Giải thích:* Hiển thị đồng thời luồng log của Nginx và Node.js App.
   - **Query 2 (Parse JSON và lọc lỗi HTTP >= 400):**
     ```logql
     {project="quiz-exam-system"} | json | status >= 400
     ```
     *Giải thích:* Bóc tách trường `status` và lọc chính xác các mã lỗi 4xx và 5xx.
   - **Query 3 (Đếm số lượng lỗi trong 5 phút):**
     ```logql
     sum(count_over_time({project="quiz-exam-system"} | json | status >= 400 [5m]))
     ```
     *Giải thích:* Đếm số lượng lỗi tích lũy trong 5 phút gần nhất.
3. **Chứng minh 4 biện pháp Hardening:**
   - Non-root user: `docker exec quiz-exam-system-app-1 id` -> `uid=1000(node)`.
   - Drop capabilities: `docker inspect quiz-exam-system-app-1 | grep -A 3 CapDrop` -> `ALL`.
   - Security headers: `curl -I http://localhost:18098/` -> `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`.
   - Ràng buộc Loopback: MySQL bind `127.0.0.1:13325`, quản trị bind loopback, app không bind cổng host.
