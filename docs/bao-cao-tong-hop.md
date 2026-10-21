# BÁO CÁO TỔNG HỢP BÀI TẬP LỚN THỰC HÀNH HỌC PHẦN
## MÔN HỌC: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
### ĐỀ TÀI SỐ 35: HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN (QUIZ EXAM SYSTEM)

---
* **Sinh viên thực hiện:** Nguyễn Nam Khánh  
* **Mã số sinh viên:** DTC245220039  
* **Lớp:** K23  
* **Khoa:** Công nghệ Thông tin - Trường Đại học Công nghệ Thông tin và Truyền thông (ICTU)  
* **Giảng viên hướng dẫn:** Bộ môn Hệ thống Thông tin  
* **Thời gian thực hiện:** Học kỳ I - Năm học 2025 - 2026  

---

## MỤC LỤC TỔNG THỂ

* **CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ MỤC TIÊU DỰ ÁN**
  * 1.1. Bối cảnh và tính cấp thiết của đề tài Đề 35
  * 1.2. Mục tiêu kỹ thuật và yêu cầu học phần
  * 1.3. Phạm vi triển khai và kết quả chuyển giao
* **CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU**
  * 2.1. Kiến trúc tổng thể Multi-tier với Docker Compose (11 containers)
  * 2.2. Phân vùng mạng `quiz_internal` và cấu hình phơi nhiễm cổng Loopback
  * 2.3. Thiết kế cơ sở dữ liệu quan hệ MySQL `quiz_exam` và cơ chế Snapshot bất biến
* **CHƯƠNG 3: TRIỂN KHAI CÁC DỊCH VỤ CỐT LÕI (CORE SERVICES)**
  * 3.1. Xây dựng dịch vụ Ứng dụng Backend/Frontend (Node.js & Express)
  * 3.2. Cấu hình cơ sở dữ liệu MySQL 8.4 LTS và phpMyAdmin
  * 3.3. Cấu hình Reverse Proxy Nginx và kiểm soát tải
* **CHƯƠNG 4: HỆ THỐNG GIÁM SÁT HIỆU NĂNG VỚI PROMETHEUS & GRAFANA**
  * 4.1. Kiến trúc thu thập chỉ số (Metrics Scrape Architecture)
  * 4.2. Cấu hình các Exporter chuyên dụng (Node.js, Nginx, MySQL, cAdvisor)
  * 4.3. Thiết kế Dashboard Grafana trực quan hóa thời gian thực (Bao gồm CPU và RAM Container)
* **CHƯƠNG 5: HỆ THỐNG QUẢN LÝ LOG TẬP TRUNG VỚI LOKI & PROMTAIL**
  * 5.1. Luồng thu thập Log JSON qua Shared Volumes
  * 5.2. Đánh giá thành phần Promtail và tính ổn định
  * 5.3. Xây dựng và kiểm chứng 3 truy vấn LogQL phục vụ phân tích sự cố
* **CHƯƠNG 6: CÁC BIỆN PHÁP BẢO MẬT VÀ GIA CỐ HỆ THỐNG (HARDENING)**
  * 6.1. Gia cố cấp độ Container và Hạt nhân Linux (Kernel Capabilities)
  * 6.2. Cô lập mạng và bảo vệ giao diện Loopback MySQL
  * 6.3. Phòng chống các lỗ hổng OWASP Top 10 trong mã nguồn
* **CHƯƠNG 7: KẾT QUẢ KIỂM THỬ THỰC TẾ VÀ ĐỐI CHIẾU TIÊU CHÍ**
  * 7.1. Kết quả kiểm thử tự động (Unit Test & Integration Test)
  * 7.2. Kết quả kiểm thử tải, đồng thời (Concurrency) và phục hồi phiên (F5)
  * 7.3. Bảng đối chiếu nghiệm thu tiêu chí chấm điểm và danh mục ảnh minh chứng
* **CHƯƠNG 8: HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH VÀ BẢO TRÌ**
  * 8.1. Yêu cầu môi trường tiền điều kiện
  * 8.2. Quy trình dựng hệ thống từ đầu (Clean Deployment)
  * 8.3. Hướng dẫn sao lưu và phục hồi dữ liệu
* **KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**

---

# CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ MỤC TIÊU DỰ ÁN

## 1.1. Bối cảnh và tính cấp thiết của đề tài Đề 35
Trong đào tạo đại học theo tín chỉ, hoạt động đánh giá định kỳ qua hình thức thi trắc nghiệm trực tuyến đòi hỏi hệ thống phần mềm phải bảo đảm các tiêu chuẩn khắt khe về độ tin cậy, tính toàn vẹn dữ liệu, hiệu năng phản hồi và an toàn thông tin.

Đề tài số 35 đặt ra bài toán xây dựng hoàn chỉnh **"Hệ thống Quiz / Thi trắc nghiệm trực tuyến"** tập trung sâu vào kỹ năng **Triển khai và Quản trị Hệ thống Phần mềm (DevOps/SysAdmin)**:
1. Đóng gói dịch vụ nhất quán bằng Container hóa (Docker Compose với đúng 11 containers phối hợp).
2. Định tuyến ngược an toàn và cân bằng tải qua Reverse Proxy Nginx.
3. Giám sát tự động chỉ số tài nguyên phần cứng, hiệu năng database và ứng dụng qua Prometheus & Grafana (đầy đủ biểu đồ CPU, RAM, QPS).
4. Quản lý, gom tập trung và truy vấn log sự cố qua Loki & Promtail với cú pháp LogQL có nhãn `project="quiz-exam-system"`.
5. Áp dụng quy chuẩn bảo mật chuyên sâu (Hardening) nhằm bảo vệ hệ thống trước các nguy cơ tấn công mạng.

## 1.2. Mục tiêu kỹ thuật và yêu cầu học phần
Dự án được xây dựng bám sát đề bài và khung tiêu chí đánh giá của học phần:
* **Khởi chạy tự động:** Toàn bộ hệ thống 11 dịch vụ khởi chạy đồng bộ với `docker compose up -d`, có khả năng lưu trữ dữ liệu qua named volumes.
* **Nghiệp vụ thi trắc nghiệm đầy đủ:** Quản lý ngân hàng câu hỏi theo 5 danh mục chuyên môn (15 bài thi chuẩn, mỗi bài 10 câu hỏi, 4 lựa chọn, đúng 1 đáp án, có giải thích rõ ràng). Cơ chế đếm ngược đồng bộ theo đồng hồ máy chủ (ISO 8601 UTC), tự động lưu câu trả lời (Autosave), phục hồi trạng thái khi tải lại trang (F5), và chấm điểm tức thời theo thang điểm 10.
* **Bảo đảm toàn vẹn:** Áp dụng Snapshot đề thi (`exam_snapshot_json`) nhằm cố định đề thi tại thời điểm thí sinh bắt đầu làm bài, ngăn chặn hiện tượng giáo viên sửa đề gốc làm sai lệch bài thi đang diễn ra.
* **Giám sát và Cảnh báo:** Hệ thống giám sát trực quan đo lường CPU Container, RAM Container, QPS, kết nối hoạt động của Nginx, luồng truy vấn MySQL và bộ nhớ Heap của ứng dụng Node.js.

## 1.3. Phạm vi triển khai và kết quả chuyển giao
* Hệ thống mã nguồn hoàn chỉnh viết bằng Node.js / Express (CommonJS), vanilla JavaScript ES6, HTML5, CSS3 hiện đại, không phụ thuộc thư viện UI cồng kềnh.
* Cấu hình phân tầng Reverse Proxy Nginx với bộ quy tắc Security Headers nghiêm ngặt.
* Bộ kịch bản di chuyển lược đồ (`db/migrate.js`) và nạp dữ liệu hạt giống (`db/seed.sql`, `db/seed.js`) có tính chất Idempotent (chạy lặp lại an toàn không sinh trùng lặp bản ghi).
* 11 container dịch vụ liên kết chặt chẽ trong mạng Docker nội bộ.
* Bộ tài liệu hướng dẫn vận hành, kịch bản demo 10 phút, bảng đối chiếu tiêu chí và danh mục ảnh minh chứng thực tế.

---

# CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU

## 2.1. Kiến trúc tổng thể Multi-tier với Docker Compose (11 containers)
Hệ thống được thiết kế theo mô hình kiến trúc nhiều tầng (Multi-tier Architecture), phân chia rành mạch 11 container dịch vụ:
1. `nginx`: Reverse Proxy tiếp nhận traffic bên ngoài tại cổng 18098.
2. `app`: Ứng dụng Backend/Frontend Node.js Express tại cổng nội bộ 18095.
3. `mysql`: Máy chủ cơ sở dữ liệu MySQL 8.4 LTS chứa cơ sở dữ liệu `quiz_exam`.
4. `phpmyadmin`: Giao diện quản trị database kết nối nội bộ.
5. `cadvisor`: Thu thập thông số phần cứng thực tế của từng container (CPU, RAM).
6. `mysql-exporter`: Thu thập metrics hoạt động của MySQL.
7. `nginx-exporter`: Thu thập metrics kết nối của Nginx.
8. `prometheus`: Máy chủ giám sát và lưu trữ time-series database.
9. `grafana`: Nền tảng trực quan hóa số liệu dashboard và truy vấn log.
10. `loki`: Máy chủ quản lý và đánh chỉ mục log tập trung.
11. `promtail`: Tiến trình agent gom log JSON từ file đưa về Loki.

```
[ Người dùng / Thí sinh / Giảng viên ]
                   │
                   ▼ (HTTP Port 18098)
       ┌──────────────────────┐
       │ Nginx Reverse Proxy  │ ◄─── Chặn truy cập trái phép, kiểm soát Rate Limit 30r/s
       └──────────┬───────────┘      Gắn bộ Security Headers (CSP, X-Frame-Options DENY)
                  │ (quiz_internal:18095)
                  ▼
       ┌──────────────────────┐
       │ Node.js Backend App  │ ◄─── Chạy Non-Root (uid 1000), Drop ALL Capabilities
       └──────────┬───────────┘
                  │ (quiz_internal:3306)
                  ▼
       ┌──────────────────────┐
       │ MySQL 8.4 Server     │ ◄─── Database: quiz_exam (mysql_data Volume)
       │ (127.0.0.1:13325)    │
       └──────────────────────┘
                  ▲
                  │ (Kết nối quản trị loopback 127.0.0.1:18096)
       ┌──────────────────────┐
       │      phpMyAdmin      │
       └──────────────────────┘
```

## 2.2. Phân vùng mạng và cấu hình phơi nhiễm cổng Loopback
Qua lệnh kiểm tra thực tế `docker network inspect quiz-exam-system_quiz_internal`, cấu hình mạng như sau:
* Toàn bộ 11 container cùng gia nhập vào mạng bridge `quiz-exam-system_quiz_internal` (dải subnet `172.28.0.0/16`), cho phép các service phân giải DNS qua tên dịch vụ (`app`, `mysql`, `loki`, `prometheus`,...).
* **Cổng công khai:** Chỉ duy nhất cổng `18098` của Nginx được mở ra bên ngoài (`0.0.0.0:18098`) để phục vụ người dùng.
* **Cổng gắn trên Loopback (`127.0.0.1`):** Cổng MySQL (`127.0.0.1:13325`), phpMyAdmin (`127.0.0.1:18096`), Grafana (`127.0.0.1:18097`), Prometheus (`127.0.0.1:19095`), Loki (`127.0.0.1:13105`) chỉ bind trên địa chỉ loopback cục bộ của host. Thiết lập này ngăn chặn triệt để mọi truy cập trái phép từ bên ngoài mạng Internet vào các dịch vụ quản trị nhạy cảm.
* **App Container:** Hoàn toàn không publish bất kỳ cổng nào ra host, chỉ lắng nghe cổng nội bộ `18095` để Nginx và Prometheus kết nối trong mạng bridge.

## 2.3. Thiết kế cơ sở dữ liệu quan hệ MySQL `quiz_exam` và cơ chế Snapshot bất biến
Cơ sở dữ liệu thống nhất mang tên **`quiz_exam`**, bao gồm 7 bảng thực thể:
1. `users`: Quản lý tài khoản (Admin, Student), băm mật khẩu Bcrypt salt 10, quản lý phiên qua `token_version`.
2. `categories`: Quản lý 5 danh mục kiến thức chuyên ngành.
3. `exams`: Thông tin đề thi, thời gian làm bài, điểm đạt, trạng thái (`draft`, `published`, `closed`), liên kết khóa ngoại với `categories`.
4. `questions`: Ngân hàng câu hỏi trắc nghiệm, điểm số và lời giải thích.
5. `choices`: 4 lựa chọn cho mỗi câu hỏi, cờ `is_correct` xác định đáp án đúng duy nhất.
6. `attempts`: Lưu vết lượt thi của thí sinh, thời điểm bắt đầu, thời hạn kết thúc (`due_at`), điểm số, trạng thái (`in_progress`, `completed`, `timed_out`).
7. `attempt_answers`: Lưu vết câu trả lời của thí sinh cho từng câu hỏi phục vụ autosave.

> **Cơ chế Snapshot đề thi (`exam_snapshot_json`):**  
> Khi thí sinh bấm "Bắt đầu làm bài", hệ thống tự động gom toàn bộ danh sách câu hỏi và các lựa chọn (đã loại bỏ cờ `is_correct`) đóng gói thành chuỗi JSON bất biến lưu trực tiếp vào cột `exam_snapshot_json` trong bảng `attempts`. Toàn bộ quá trình làm bài và chấm điểm sau đó sẽ đọc trực tiếp từ bản chụp này. Nhờ đó, nếu giáo viên quản trị có chỉnh sửa nội dung câu hỏi, xóa đáp án hoặc sửa điểm ở đề gốc thì bài thi của thí sinh đang làm hoặc đã làm hoàn toàn không bị ảnh hưởng.

---

# CHƯƠNG 3: TRIỂN KHAI CÁC DỊCH VỤ CỐT LÕI (CORE SERVICES)

## 3.1. Xây dựng dịch vụ Ứng dụng Backend/Frontend (Node.js & Express)
* **Dockerfile tối ưu:** Sử dụng base image `node:24-alpine` siêu nhẹ, giảm thiểu diện tích tấn công.
* **Quản lý tiến trình Non-Root:** Sử dụng người dùng hệ thống mặc định `node` (UID:GID = 1000:1000). Toàn bộ quyền sở hữu mã nguồn và thư mục ghi log `/var/log/app` được cấp phát chính xác cho user `node`.
* **API RESTful chuẩn mực:**
  * Xác thực: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
  * Danh mục & Đề thi: `GET /api/categories`, `GET /api/exams`, `GET /api/exams/:id`.
  * Quản trị: `POST /api/admin/exams`, `POST /api/admin/exams/:id/questions`, `PUT /api/admin/exams/:id/status`.
  * Lượt thi: `POST /api/attempts/start`, `POST /api/attempts/:id/save-answer`, `POST /api/attempts/:id/submit`, `GET /api/attempts/history`.

## 3.2. Cấu hình cơ sở dữ liệu MySQL 8.4 LTS và phpMyAdmin
* Sử dụng phiên bản MySQL 8.4 Long-Term Support (LTS).
* Thiết lập chuẩn mã hóa toàn diện `utf8mb4` và collation `utf8mb4_unicode_ci` trên cấp độ máy chủ, bảo đảm hiển thị tiếng Việt có dấu chuẩn xác 100%.
* Tên cơ sở dữ liệu: `quiz_exam`. Cấu hình Healthcheck sử dụng `mysqladmin ping` định kỳ 10 giây để báo hiệu sẵn sàng cho các dịch vụ phụ thuộc.
* Tích hợp phpMyAdmin kết nối trực tiếp vào mạng nội bộ `quiz_internal`.

## 3.3. Cấu hình Reverse Proxy Nginx và kiểm soát tải
* Đóng vai trò là cổng ngõ duy nhất đón nhận kết nối từ trình duyệt thí sinh tại cổng `18098`.
* Ẩn danh hoàn toàn thông tin phiên bản phần mềm máy chủ thông qua chỉ thị `server_tokens off`.
* Cấu hình thuật toán giới hạn tần suất yêu cầu (Rate Limiting) với bộ nhớ đệm `limit_req_zone $binary_remote_addr zone=one:10m rate=30r/s`, bảo vệ hệ thống trước các nguy cơ tấn công từ chối dịch vụ (DoS/Brute Force).
* Chặn hoàn toàn truy cập từ bên ngoài vào các endpoint nội bộ như `/stub_status` và `/metrics`.

---

# CHƯƠNG 4: HỆ THỐNG GIÁM SÁT HIỆU NĂNG VỚI PROMETHEUS & GRAFANA

## 4.1. Kiến trúc thu thập chỉ số (Metrics Scrape Architecture)
Prometheus được cấu hình hoạt động theo cơ chế Pull Model, định kỳ mỗi 15 giây gửi yêu cầu HTTP GET đến các Exporter nội bộ để cào dữ liệu chỉ số.

## 4.2. Cấu hình các Exporter chuyên dụng
1. **cAdvisor (`cadvisor:8080`):** Giám sát trực tiếp tài nguyên phần cứng thực tế (CPU usage, Memory RSS, Network I/O, Disk I/O) của toàn bộ 11 container trong stack.
2. **Nginx Prometheus Exporter (`nginx-exporter:9113`):** Cào dữ liệu từ module `stub_status` của Nginx, cung cấp số lượng kết nối đang hoạt động (`nginx_connections_active`), số kết nối được chấp nhận (`nginx_connections_accepted`) và tổng số request.
3. **MySQL Exporter (`mysql-exporter:9104`):** Thu thập trạng thái hoạt động của cơ sở dữ liệu (`mysql_up`), số lượng truy vấn thực thi (`mysql_global_status_queries`), số luồng kết nối đồng thời (`mysql_global_status_threads_connected`).
4. **Node.js App Metrics (`app:18095/metrics`):** Xuất bản các chỉ số tùy biến chuyên sâu:
   * `app_uptime_seconds`: Thời gian chạy liên tục của ứng dụng.
   * `app_requests_total`: Tổng số lượt yêu cầu HTTP đã xử lý.
   * `app_http_errors_total`: Tổng số lỗi HTTP (4xx, 5xx) phát sinh.
   * `app_nodejs_heap_used_bytes` & `app_nodejs_heap_total_bytes`: Dung lượng bộ nhớ Heap V8 của Node.js.

## 4.3. Thiết kế Dashboard Grafana trực quan hóa thời gian thực (Bao gồm CPU và RAM Container)
Grafana được triển khai với tính năng tự động nạp cấu hình (Provisioning):
* Tự động kết nối Datasource Prometheus (`http://prometheus:9090`) và Datasource Loki (`http://loki:3100`).
* Nạp sẵn Dashboard **"Quiz Exam System - Overview Monitoring"** với đầy đủ các panel hiển thị trực quan:
  * Trạng thái sống còn MySQL & Nginx (Stat panels: `mysql_up = 1`, `nginx_up = 1`).
  * Tổng số HTTP Requests & HTTP Errors (`app_requests_total`, `app_http_errors_total`).
  * Nginx Active Connections.
  * Node.js App Heap Memory (Timeseries: Heap Used vs Heap Total).
  * **Container CPU Usage Seconds:** Đo lường tốc độ CPU tiêu thụ của 11 container theo thời gian thực (`rate(container_cpu_usage_seconds_total[1m])`).
  * **Container RAM Working Set (Bytes):** Đo lường dung lượng RAM thực tế đang chiếm dụng của từng container (`container_memory_working_set_bytes`).
  * MySQL Queries / s (`rate(mysql_global_status_queries[1m])`).

---

# CHƯƠNG 5: HỆ THỐNG QUẢN LÝ LOG TẬP TRUNG VỚI LOKI & PROMTAIL

## 5.1. Luồng thu thập Log JSON qua Shared Volumes
* **Định dạng Log có cấu trúc (Structured JSON):** 
  * Nginx xuất log truy cập theo cấu trúc JSON: `time_local`, `remote_addr`, `request_method`, `request_uri`, `status`, `body_bytes_sent`, `request_time`.
  * Node.js App ghi log định dạng JSON ra file `/var/log/app/app.log`: `time`, `method`, `url`, `status`, `response_time_ms`.
* **Cơ chế gom log:** Promtail gắn kết trực tiếp vào hai volume chia sẻ `nginx_logs` và `app_logs`. Nhờ đó, Promtail đọc log trực tiếp từ file theo thời gian thực (tail file) mà không bị phụ thuộc vào Docker logging driver.
* **Gắn nhãn tĩnh tối ưu:** Promtail gán nhãn `project="quiz-exam-system"` và `service="app" | "nginx"`, duy trì số lượng luồng (Cardinality) ở mức cực thấp, bảo đảm Loki vận hành nhẹ và truy vấn cực nhanh.

## 5.2. Đánh giá thành phần Promtail và tính ổn định
Promtail v3.5 là giải pháp thu thập log kinh điển, tiêu chuẩn trong hệ sinh thái Grafana Loki. Mặc dù Grafana Labs hiện đang định hướng phát triển Grafana Alloy, Promtail vẫn là lựa chọn cực kỳ ổn định, quen thuộc trong chương trình đào tạo và tương thích tuyệt đối với Loki v3.6 trong Docker Compose.

## 5.3. Xây dựng và kiểm chứng 3 truy vấn LogQL phục vụ phân tích sự cố
Hệ thống kiểm chứng và lưu trữ nguyên vẹn 3 câu truy vấn LogQL đã chạy thành công trong thực tế:
1. **Truy vấn 1 - Xem toàn bộ luồng log của Quiz Exam System:**
   ```logql
   {project="quiz-exam-system"}
   ```
   *Mục đích:* Giám sát toàn bộ các luồng sự kiện xảy ra trên cả lớp Proxy Nginx và ứng dụng Node.js.
2. **Truy vấn 2 - Parse JSON và lọc mã lỗi HTTP >= 400 (bao gồm cả 4xx và 5xx):**
   ```logql
   {project="quiz-exam-system"} | json | status >= 400
   ```
   *Mục đích:* Sử dụng bộ lọc JSON parser bóc tách trường số nguyên `status` từ dòng log, lọc chính xác các lỗi từ 400 đến 599 (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Error).
3. **Truy vấn 3 - Thống kê số lượng lỗi trong cửa sổ 5 phút:**
   ```logql
   sum(count_over_time({project="quiz-exam-system"} | json | status >= 400 [5m]))
   ```
   *Mục đích:* Tính toán tổng số lượng lỗi phát sinh trong 5 phút gần nhất, đóng vai trò làm tín hiệu kích hoạt cảnh báo (Alert Rule).

---

# CHƯƠNG 6: CÁC BIỆN PHÁP BẢO MẬT VÀ GIA CỐ HỆ THỐNG (HARDENING)

Hệ thống đã triển khai và kiểm chứng thực tế tối thiểu 4 biện pháp bảo vệ chuyên sâu:

## 6.1. Biện pháp 1: Chạy Container với đặc quyền tối thiểu (Non-Root User)
* Container Node.js chạy hoàn toàn dưới quyền người dùng thông thường `node` (UID: 1000).
* **Kiểm chứng:** Lệnh `docker exec quiz-exam-system-app-1 id` trả về `uid=1000(node) gid=1000(node)`.
* **Ý nghĩa:** Nếu ứng dụng có lỗ hổng thực thi mã từ xa (RCE), kẻ tấn công cũng không thể chiếm quyền root của máy chủ hoặc phá hoại hệ điều hành container.

## 6.2. Biện pháp 2: Loại bỏ toàn bộ Linux Kernel Capabilities & Cấm leo thang đặc quyền
* Trong file `docker-compose.yml`, thiết lập:
  ```yaml
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
  ```
* **Kiểm chứng:** Lệnh `docker inspect quiz-exam-system-app-1` xác nhận `CapDrop: ["ALL"]` và `SecurityOpt: ["no-new-privileges:true"]`.

## 6.3. Biện pháp 3: Cô lập mạng nội bộ & Ràng buộc cổng Loopback
* Mọi dịch vụ nhạy cảm như MySQL (`127.0.0.1:13325`), phpMyAdmin (`127.0.0.1:18096`), Grafana (`127.0.0.1:18097`), Prometheus (`127.0.0.1:19095`), Loki (`127.0.0.1:13105`) đều được cấu hình bind trực tiếp vào giao diện `127.0.0.1`.
* Container App không publish cổng ra ngoài host.
* **Ý nghĩa:** Loại bỏ nguy cơ bị scan cổng từ mạng bên ngoài, triệt tiêu nguy cơ tấn công brute force cơ sở dữ liệu MySQL từ Internet.

## 6.4. Biện pháp 4: Bảo mật ứng dụng Web toàn diện (Anti-OWASP Top 10)
* **Bảo vệ chống XSS & Clickjacking:** Tích hợp bộ tiêu đề HTTP Security Headers tại Nginx và middleware Helmet (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
* **Bảo vệ chống SQL Injection:** 100% các câu truy vấn cơ sở dữ liệu đều sử dụng kỹ thuật Prepared Statements với tham số ràng buộc `?`, tuyệt đối không nối chuỗi truy vấn thô.
* **Bảo vệ chống CSRF & Đánh cắp phiên:**
  * JWT được lưu trong Cookie bảo mật với các cờ `HttpOnly`, `SameSite=Lax`.
  * Cơ chế Anti-CSRF Token: Mỗi phiên đăng nhập sinh một chuỗi ngẫu nhiên lưu trong Cookie `csrf_token`. Tất cả các thao tác nhạy cảm (POST, PUT, DELETE) bắt buộc phải kèm theo Header `X-CSRF-Token` khớp với Cookie mới được thực thi.
* **Cơ chế thu hồi phiên tức thời (Token Revocation):** Bảng `users` lưu trường `token_version`. Khi người dùng bấm Đăng xuất, `token_version` lập tức tăng lên 1 đơn vị trên database. Kể cả khi kẻ tấn công lưu trộm chuỗi JWT cũ, mọi request gửi lên sau thời điểm đăng xuất đều bị từ chối truy cập (401 Unauthorized).
* **Khóa giao dịch đồng thời (Concurrency Lock):** Khi nộp bài thi, hệ thống sử dụng cú pháp `SELECT ... FOR UPDATE` trong Transaction của MySQL, loại bỏ hiện tượng chấm điểm trùng lặp.

---

# CHƯƠNG 7: KẾT QUẢ KIỂM THỬ THỰC TẾ VÀ ĐỐI CHIẾU TIÊU CHÍ

## 7.1. Kết quả kiểm thử tự động (Unit Test & Integration Test)
Toàn bộ quá trình kiểm thử được thực thi trực tiếp bên trong container ứng dụng:
* **Bộ Unit Test (`tests/quiz_business.test.js`):** 5/5 kiểm thử ĐẠT (100% PASS).
* **Bộ Integration Test (`tests/real_business.test.js`, `tests/security_edge_cases.test.js`, `tests/categories_and_search.test.js`):** 17/17 kiểm thử ĐẠT (100% PASS).

## 7.2. Kết quả kiểm thử tải, đồng thời (Concurrency) và phục hồi phiên (F5)
* Gửi 5 request nộp bài cùng lúc: Ghi nhận 1 lần chấm điểm duy nhất, không deadlock.
* Tắt tab trình duyệt và F5: Khôi phục chính xác các đáp án đã chọn và hạn nộp bài.

## 7.3. Bảng đối chiếu nghiệm thu tiêu chí chấm điểm và danh mục ảnh minh chứng
*(Chi tiết tại file `docs/doi-chieu-yeu-cau.md`)*:
* Danh mục vị trí ảnh chụp minh chứng thực tế:
  * `docs/images/01_docker_compose_ps.png`: Trạng thái 11 container.
  * `docs/images/02_website_home_categories.png`: Giao diện danh mục đề thi.
  * `docs/images/03_website_exam_taking.png`: Giao diện làm bài thi.
  * `docs/images/04_test_results.png`: Kết quả 22 test tự động PASS.
  * `docs/images/05_phpmyadmin_tables.png`: Cấu trúc bảng database `quiz_exam`.
  * `docs/images/06_nginx_headers_curl.png`: Security headers từ Nginx.
  * `docs/images/07_prometheus_targets.png`: 5 targets Prometheus UP.
  * `docs/images/08_grafana_dashboard.png`: Dashboard Grafana có CPU và RAM Container.
  * `docs/images/09_grafana_loki_explore.png`: Kết quả 3 truy vấn LogQL.
  * `docs/images/10_hardening_verification.png`: Kiểm tra Non-root, Drop capabilities.
  * `docs/images/11_git_log.png`: Lịch sử git commit theo chuẩn.

---

# CHƯƠNG 8: HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH VÀ BẢO TRÌ

## 8.1. Yêu cầu môi trường tiền điều kiện
* Hệ điều hành: Linux (Ubuntu 22.04 / 24.04 LTS hoặc WSL2 trên Windows).
* Phần mềm: Docker Engine phiên bản >= 24.0.0, Docker Compose phiên bản >= 2.20.0.
* Các cổng mạng còn trống: `18098` (Nginx Web), `18096` (phpMyAdmin), `18097` (Grafana), `19095` (Prometheus), `13105` (Loki), `13325` (MySQL).

## 8.2. Quy trình dựng hệ thống từ đầu (Clean Deployment)
```bash
# Bước 1: Sao chép tệp biến môi trường
cp .env.example .env

# Bước 2: Khởi tạo tệp cấu hình xác thực cho MySQL Exporter (nằm trong .gitignore)
cat << 'EOF' > monitoring/my.cnf
[client]
user=exporter
password=ExporterPassword@123
EOF
chmod 600 monitoring/my.cnf

# Bước 3: Xây dựng và khởi chạy toàn bộ 11 container
docker compose up -d --build

# Bước 4: Kiểm tra trạng thái các container
docker compose ps
```

## 8.3. Hướng dẫn sao lưu và phục hồi dữ liệu
```bash
# Sao lưu cơ sở dữ liệu quiz_exam
docker compose exec -T mysql mysqldump -u quiz_app -p'change_this_password' quiz_exam > backup_quiz_exam.sql

# Phục hồi cơ sở dữ liệu
cat backup_quiz_exam.sql | docker compose exec -T mysql mysql -u quiz_app -p'change_this_password' quiz_exam
```

---

# KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## Kết luận
Dự án xây dựng **Hệ thống Quiz / Thi trắc nghiệm trực tuyến (Đề tài số 35)** đã hoàn thành xuất sắc các mục tiêu đề ra:
1. Đóng gói và cô lập 11 dịch vụ bằng Docker Compose với khả năng khởi động đồng bộ.
2. Triển khai ứng dụng web hoàn chỉnh với 5 danh mục, 15 bài thi chuẩn và 151 câu hỏi thực tế.
3. Thiết lập Reverse Proxy Nginx bảo mật với Rate Limiting và Security Headers.
4. Giám sát toàn diện với Prometheus và Dashboard Grafana có cả CPU và RAM container thực tế.
5. Quản lý log tập trung với Loki + Promtail và làm chủ 3 câu truy vấn LogQL chuẩn xác.
6. Áp dụng và kiểm chứng thực tế 4 biện pháp Hardening chuyên sâu.
7. Đạt 100% tỷ lệ vượt qua các bài kiểm thử tự động.

---
*Báo cáo được hoàn thành bởi sinh viên Nguyễn Nam Khánh - DTC245220039.*
