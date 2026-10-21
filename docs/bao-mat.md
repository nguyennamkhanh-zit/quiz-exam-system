# Báo Cáo Triển Khai Hardening & Bảo Mật Hệ Thống

Dự án áp dụng toàn diện các biện pháp Hardening và phòng thủ chiều sâu (Defense-in-Depth) theo tiêu chí đánh giá môn học:

## 1. Biện pháp 1: Chạy Container Non-Root & Hạn chế quyền (Least Privilege)
- **Node.js App:** Chạy dưới tài khoản người dùng thường `USER node` bên trong `Dockerfile` (UID 1000). Không chạy tiến trình ứng dụng dưới quyền `root`.
- **Docker Compose:** Thiết lập `security_opt: - no-new-privileges:true` nhằm ngăn chặn các tiến trình con leo thang đặc quyền.
- **Capabilities:** Áp dụng `cap_drop: - ALL` và chỉ cấp thêm các capabilities thực sự tối thiểu (`CHOWN`, `SETUID`, `SETGID`) cần thiết cho môi trường chạy.

## 2. Biện pháp 2: Cô Lập Mạng (Network Isolation) & Giới hạn Bind Port
- Toàn bộ các container (`app`, `mysql`, `phpmyadmin`, `prometheus`, `grafana`, `loki`, `promtail`, `exporters`) chỉ giao tiếp qua mạng nội bộ Docker `quiz_internal`.
- **MySQL Database:** Không công khai cổng ra Internet; cổng kiểm tra trên máy chủ chỉ bind vào `127.0.0.1:13325`.
- **Công cụ quản trị & Giám sát:** phpMyAdmin (`18096`), Grafana (`18097`), Prometheus (`19095`), Loki (`13105`) đều chỉ bind vào `127.0.0.1`, không mở công khai cho bên ngoài.
- Duy nhất cổng `18095` (Nginx Reverse Proxy) tiếp nhận lưu lượng truy cập của người dùng.

## 3. Biện pháp 3: Nginx Security Headers & Ẩn thông tin nhạy cảm
- Cấu hình chỉ thị `server_tokens off;` che giấu số hiệu phiên bản máy chủ Nginx trong các HTTP response header.
- Thêm đầy đủ các Header bảo mật khuyến nghị bởi OWASP:
  - `X-Frame-Options "DENY"`: Ngăn chặn trang web bị nhúng vào iframe, phòng chống Clickjacking.
  - `X-Content-Type-Options "nosniff"`: Ngăn chặn trình duyệt tự ý đoán định dạng file (MIME-sniffing).
  - `X-XSS-Protection "1; mode=block"`: Kích hoạt bộ lọc chống XSS của trình duyệt cũ.
  - `Referrer-Policy "strict-origin-when-cross-origin"`: Giới hạn thông tin đường dẫn gửi kèm khi chuyển hướng.
  - `Content-Security-Policy (CSP)`: Giới hạn nghiêm ngặt nguồn tài nguyên script, style, image chỉ tải từ chính origin `'self'`.
- Chặn truy cập trực tiếp từ bên ngoài vào `/metrics` và `/stub_status` thông qua cấu hình `deny all;` trên Nginx.

## 4. Biện pháp 4: Chống Tấn Công Xác Thực, Brute-Force & CSRF
- **Băm mật khẩu:** Sử dụng thư viện `bcryptjs` với salt rounds = 10, bảo đảm chống lại tấn công Rainbow Table. Mật khẩu không bao giờ lưu dưới dạng văn bản thuần.
- **Bảo vệ Token:** JWT được lưu trữ trong Cookie với thuộc tính `HttpOnly`, ngăn ngừa triệt để nguy cơ mã độc JavaScript đánh cắp token qua lỗ hổng XSS (không lưu token trong `localStorage`).
- **Phòng chống CSRF:** Áp dụng cơ chế Anti-CSRF Token đồng bộ. Mọi thao tác thay đổi dữ liệu (POST, PUT, DELETE) bắt buộc phải gửi kèm header `x-csrf-token` khớp với token trong cookie bảo mật.
- **Rate Limiting:** Tích hợp middleware giới hạn tần suất request (tối đa 20 - 30 lượt trong 15 phút) tại các endpoint nhạy cảm `/api/auth/login` và `/api/auth/register`.

## 5. Biện pháp 5: Phòng chống SQL Injection & Thao Túng Điểm Số
- **Parameterized Queries:** 100% các câu truy vấn cơ sở dữ liệu đều sử dụng tham số `?` thông qua thư viện `mysql2/promise`. Không bao giờ cộng chuỗi trực tiếp dữ liệu người dùng vào mã SQL.
- **Chấm điểm phía Server:** Client tuyệt đối không được nhận thông tin đáp án đúng (`is_correct`) khi đang trong quá trình làm bài. Điểm số và thời gian chốt bài hoàn toàn do backend tính toán và ghi nhận qua DB Transaction.
