# Quiz Exam System - Hệ Thống Thi Trắc Nghiệm Trực Tuyến

**Đề tài thực hành số 35:** Hệ thống Quiz / Thi trắc nghiệm  
**Môn học:** Triển khai và Quản trị Hệ thống Phần mềm (K23)  
**Sinh viên thực hiện:** Nguyễn Nam Khánh - Mã SV: DTC245220039  
**Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Công nghệ Thông tin & Truyền thông (ICTU)

---

## 1. Giới thiệu tổng quan

Hệ thống Quiz Exam System được xây dựng và đóng gói hoàn chỉnh bằng **Docker Compose**, cung cấp nền tảng thi trắc nghiệm trực tuyến chuyên nghiệp và bảo mật:
* **Phân hệ Thí sinh (Student):**
  * Duyệt ngân hàng đề thi theo **5 danh mục chuyên môn** (Triển khai & Quản trị HTPM, An toàn thông tin, Mạng máy tính, Cơ sở dữ liệu, Lập trình Web).
  * Tìm kiếm đề thi theo từ khóa thời gian thực.
  * Làm bài thi trực tuyến với đồng hồ đếm ngược đồng bộ từ máy chủ (ISO 8601 UTC).
  * Tự động lưu bài làm (Autosave), an toàn khi tải lại trang hoặc mất kết nối (F5).
  * Tự động chấm điểm khách quan theo thang điểm 10 khi nộp bài hoặc hết giờ.
  * Xem lại bài thi chi tiết, chỉ rõ câu đúng (xanh lá), câu sai (đỏ) kèm giải thích chi tiết.
* **Phân hệ Quản trị viên (Admin):**
  * Quản lý danh mục và tạo đề thi mới với 4 lựa chọn, đúng 1 đáp án.
  * Đóng mở hoặc chuyển trạng thái đề thi (`draft`, `published`, `closed`).
  * Khóa xóa danh mục khi đang có đề thi liên kết (Khóa ngoại `ON DELETE RESTRICT`).
  * Theo dõi kết quả và lịch sử thi của tất cả thí sinh.
* **Cơ chế Snapshot đề thi bất biến (`exam_snapshot_json`):**
  * Khi thí sinh bắt đầu thi, toàn bộ câu hỏi và lựa chọn được đóng băng lưu vào bản ghi lượt thi. Việc Admin chỉnh sửa nội dung đề gốc sau đó không làm sai lệch bài thi của thí sinh.

---

## 2. Ngăn Xếp Công Nghệ (Technology Stack)

* **Backend & Frontend:** Node.js v24 LTS, Express.js (CommonJS), Vanilla JavaScript ES6, HTML5, CSS3 Responsive.
* **Cơ sở dữ liệu:** MySQL 8.4 LTS (`utf8mb4_unicode_ci`) và phpMyAdmin 5.2.
* **Reverse Proxy:** Nginx Stable Alpine với bộ Security Headers nghiêm ngặt (CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Rate Limiting 30r/s).
* **Hạ tầng Giám sát:** Prometheus v3.15, Grafana v13.2, cAdvisor v0.60, Nginx Exporter, MySQL Exporter.
* **Hạ tầng Logging:** Grafana Loki v3.6, Promtail v3.5, Structured JSON Logs, LogQL.
* **Bảo mật & Hardening:** Container chạy Non-Root (`node:node`), `no-new-privileges:true`, `cap_drop: [ALL]`, cách ly mạng nội bộ (`quiz_internal`), băm mật khẩu Bcrypt salt 10, HttpOnly Cookie, Anti-CSRF Token, Token Revocation, Concurrency Lock (`SELECT ... FOR UPDATE`).

---

## 3. Bảng Phân Bổ Cổng Dịch Vụ Thực Tế (Port Allocation)

| Dịch vụ | URL Truy cập | Giao diện Lắng nghe | Mô tả chức năng |
|---|---|---|---|
| **Website Chính (Nginx)** | `http://localhost:18098` | `0.0.0.0:18098` | Điểm truy cập duy nhất cho người dùng và thí sinh |
| **phpMyAdmin** | `http://localhost:18096` | `127.0.0.1:18096` | Giao diện quản trị cơ sở dữ liệu MySQL nội bộ |
| **Grafana Dashboard** | `http://localhost:18097` | `127.0.0.1:18097` | Giám sát trực quan hóa Metrics và LogQL |
| **Prometheus Web UI** | `http://localhost:19095` | `127.0.0.1:19095` | Xem trạng thái Targets và truy vấn PromQL |
| **Loki Centralized Log** | `http://localhost:13105` | `127.0.0.1:13105` | Máy chủ nhận và xử lý truy vấn LogQL |
| **MySQL Server** | `127.0.0.1:13325` | `127.0.0.1:13325` | Cổng kết nối CLI/Workbench cục bộ |

---

## 4. Hướng Dẫn Cài Đặt & Khởi Chạy Từ Đầu (Clean Deployment)

### Bước 1: Sao chép tệp biến môi trường
```bash
cp .env.example .env
```

### Bước 2: Sinh tệp cấu hình cho MySQL Exporter (được gitignore bảo vệ)
```bash
mkdir -p monitoring
cat << 'EOF' > monitoring/my.cnf
[client]
user=exporter
password=ExporterPassword@123
EOF
chmod 600 monitoring/my.cnf
```

### Bước 3: Khởi chạy toàn bộ stack bằng Docker Compose
```bash
docker compose up -d --build
```

### Bước 4: Kiểm tra trạng thái các container
```bash
docker compose ps
```
*Kết quả:* Tất cả 10 container phải ở trạng thái `Up` hoặc `Up (healthy)`.

### Bước 5: Chạy di chuyển lược đồ và nạp dữ liệu hạt giống (Idempotent)
*Hệ thống tự động nạp dữ liệu khi dựng mới container MySQL. Để chạy lại thủ công:*
```bash
docker compose exec -T app npm run migrate
docker compose exec -T app npm run seed
```
*(Chạy lại nhiều lần an toàn, không làm mất dữ liệu và không tạo bản ghi trùng lặp).*

---

## 5. Tài Khoản Thử Nghiệm Mẫu (Demo Credentials)

| Vai trò | Tên đăng nhập | Email | Mật khẩu mẫu | Ghi chú |
|---|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `admin@ictu.edu.vn` | `Admin@123456` | Toàn quyền quản trị đề thi và kết quả |
| **Thí sinh 1 (Student)** | `student1` | `student1@ictu.edu.vn` | `Student@123456` | Thí sinh Nguyễn Nam Khánh |
| **Thí sinh 2 (Student)** | `student2` | `student2@ictu.edu.vn` | `Student@123456` | Thí sinh Trần Văn Minh |

---

## 6. Hướng Dẫn Chạy Kiểm Thử Tự Động (Test Suite)

Chạy trực tiếp bên trong môi trường container của ứng dụng:

### 6.1. Chạy Unit Tests
```bash
docker compose exec -T app npm test
```
*Kiểm tra: Băm mật khẩu Bcrypt, mã hóa JWT, sinh chuỗi CSRF, logic chấm điểm tự động thang 10, xử lý đồng hồ hết giờ server.*

### 6.2. Chạy Integration Tests
```bash
docker compose exec -T app npm run test:integration
```
*Kiểm tra 17 tình huống thực tế: Quản lý danh mục & đề thi, phân quyền Admin/Student, bảo vệ chống CSRF, cách ly dữ liệu giữa các thí sinh, autosave & phục hồi F5, kiểm thử nộp bài đồng thời (Concurrency Lock) và thu hồi phiên đăng xuất.*

---

## 7. Giám Sát Prometheus & Dashboard Grafana

1. Truy cập Prometheus tại: `http://localhost:19095/targets` để xác nhận 5 targets đang `UP`:
   * `app:18095` (Quiz App Node.js metrics)
   * `mysql-exporter:9104` (MySQL metrics)
   * `nginx-exporter:9113` (Nginx metrics)
   * `cadvisor:8080` (Container CPU/RAM)
   * `127.0.0.1:9090` (Prometheus server)
2. Truy cập Grafana tại: `http://localhost:18097` (Tài khoản: `admin` / mật khẩu đã đổi an toàn).
3. Mở dashboard **"Quiz Exam System - Overview Monitoring"** để theo dõi biểu đồ thời gian thực.
4. Lệnh tạo lưu lượng kiểm thử (Traffic Generation):
   ```bash
   for i in {1..20}; do curl -s http://localhost:18098/health > /dev/null; done
   ```

---

## 8. Quản Lý Log Tập Trung & 3 Truy Vấn LogQL Mẫu

Mở Grafana -> chọn menu **Explore** -> chọn datasource **Loki**:

1. **Xem toàn bộ luồng log hệ thống (Nginx & App):**
   ```logql
   {service=~"app|nginx"}
   ```
2. **Lọc log lỗi HTTP (mã 4xx hoặc 5xx):**
   ```logql
   {service="app"} |= "status\":4"
   ```
3. **Thống kê số lượng lỗi xuất hiện trong 5 phút gần nhất:**
   ```logql
   sum(count_over_time({service="app"} |= "status\":4"[5m]))
   ```

---

## 9. Đánh Giá Hiện Trạng Hỗ Trợ Của Promtail

* **Tình trạng hỗ trợ chính thức:** Theo tài liệu từ Grafana Labs, Promtail hiện đã chuyển sang trạng thái bảo trì (Maintenance Mode / Deprecated), nhường chỗ cho thế hệ mới là **Grafana Alloy** (hợp nhất chuẩn OpenTelemetry).
* **Áp dụng trong học phần:** Nhằm tuân thủ tuyệt đối khung yêu cầu kỹ thuật của Đề 35 môn học, Promtail v3.5 được cấu hình ổn định và hoạt động chính xác 100% với định dạng log JSON từ Nginx và Node.js.

---

## 10. Dừng Hệ Thống An Toàn

```bash
# Dừng các container nhưng bảo toàn 100% dữ liệu trong các named volumes
docker compose down
```
*(Tuyệt đối không dùng cờ `-v` để tránh xóa dữ liệu các volume).*
