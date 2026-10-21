# Phạm Vi Ứng Dụng & Đặc Tả Nghiệp Vụ - Đề 35

## 1. Giới thiệu tổng quan
Hệ thống Quiz / Thi trắc nghiệm trực tuyến (Quiz Exam System) được xây dựng theo yêu cầu Đề 35 trong học phần "Triển khai và Quản trị Hệ thống Phần mềm".
Hệ thống cung cấp nền tảng quản lý đề thi, câu hỏi và tổ chức các kỳ thi trực tuyến với tính toàn vẹn cao, chống sửa đổi đề thi khi đang diễn ra, tự động chấm điểm khách quan và quản lý phiên bảo mật.

## 2. Các vai trò và phạm vi chức năng

### 2.1. Quản trị viên (Admin)
- **Xác thực:** Đăng nhập bằng tài khoản quản trị hệ thống, cấp phiên qua JWT cookie HttpOnly và cơ chế chống CSRF.
- **Quản lý đề thi:**
  - Tạo mới đề thi với tiêu đề, mô tả, thời lượng làm bài (phút), điểm chuẩn đạt (thang 10).
  - Cập nhật trạng thái đề thi:
    - `draft` (Nháp): Chỉ admin thấy và biên tập, thí sinh không thể truy cập hoặc bắt đầu thi.
    - `published` (Công bố): Mở cho thí sinh vào xem và tham gia làm bài.
    - `closed` (Đóng): Dừng nhận lượt thi mới, bảo lưu toàn bộ kết quả đã thi.
- **Quản trị ngân hàng câu hỏi:**
  - Thêm câu hỏi cho từng đề thi.
  - Mỗi câu hỏi gồm đúng 4 lựa chọn (A, B, C, D) và xác định chính xác 1 đáp án đúng duy nhất.
  - Có phần giải thích chi tiết đáp án để phục vụ học tập sau khi nộp bài.
  - Xóa câu hỏi khỏi ngân hàng đề thi.
- **Xem kết quả và thống kê:**
  - Xem danh sách toàn bộ lượt thi của thí sinh đối với từng đề.
  - Theo dõi điểm số, số câu đúng/tổng số câu, trạng thái hoàn thành và kết quả Đạt/Không đạt.

### 2.2. Thí sinh (Student)
- **Đăng ký tài khoản:** Tự đăng ký tài khoản với vai trò mặc định là `student` (quy định phía backend, cấm client tự nâng quyền).
- **Đăng nhập & Quản lý phiên:** Bảo vệ an toàn cookie HttpOnly, tự động đăng xuất xóa cookie phiên.
- **Xem đề thi:** Xem danh sách các đề thi đã được công bố (`published`).
- **Làm bài thi trực tuyến:**
  - Khi bắt đầu thi, hệ thống chụp **Snapshot** toàn bộ câu hỏi và đáp án vào bản ghi `attempts`, bảo đảm tính bất biến kể cả khi admin chỉnh sửa đề gốc sau đó.
  - Giao diện làm bài trực quan: bảng câu hỏi nhanh, chuyển câu hỏi mượt mà, phân biệt màu câu đã làm/chưa làm.
  - Đồng hồ đếm ngược đồng bộ chặt chẽ với máy chủ qua thời hạn `due_at`. Mọi hành động chỉnh sửa đồng hồ tại máy client không thể kéo dài lượt thi.
  - Tự động lưu tiến độ (Auto-save) câu trả lời lên server ngay khi chọn. F5/tải lại trang hay đổi thiết bị không làm mất bài thi.
  - Tự động nộp bài và khóa chỉnh sửa khi hết thời gian quy định.
- **Xem kết quả & Xem lại bài thi:**
  - Xem điểm số thang 10, kết quả ĐẠT / CHƯA ĐẠT.
  - Xem lại chi tiết từng câu hỏi, đáp án mình đã chọn đối chiếu với đáp án đúng và phần giải thích cặn kẽ.
  - Tra cứu lịch sử toàn bộ các lượt thi đã tham gia.

## 3. Các thành phần chưa nằm trong phạm vi (Theo đặc tả đề bài)
- Gửi email kích hoạt hoặc OTP qua SMS.
- Cổng thanh toán trực tuyến.
- Giám sát qua Webcam hoặc AI phát hiện gian lận nâng cao.
