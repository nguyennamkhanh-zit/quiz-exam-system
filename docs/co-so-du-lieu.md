# Thiết Kế Cơ Sở Dữ Liệu & Chiến Lược Toàn Vẹn Dữ Liệu

## 1. Sơ đồ Quan hệ Thực thể (ERD)

```
┌──────────────────┐
│    categories    │
│(id, name, slug)  │
└────────┬─────────┘
         │ 1:N
         ▼
┌─────────────────┐       1:N       ┌─────────────────┐       1:N       ┌─────────────────┐
│      users      ├─────────────────┤      exams      ├─────────────────┤    questions    │
│ (id, email,...) │                 │(id, title,...)  │                 │(id, exam_id,...)│
└────────┬────────┘                 └────────┬────────┘                 └────────┬────────┘
         │                                   │                                   │
         │ 1:N                               │ 1:N                               │ 1:N
         ▼                                   ▼                                   ▼
┌─────────────────────────────────────────────────────┐                 ┌─────────────────┐
│                      attempts                       │                 │     choices     │
│  (id, user_id, exam_id, exam_snapshot_json, ...)    │                 │(id, question_id)│
└──────────────────────────┬──────────────────────────┘                 └─────────────────┘
                           │
                           │ 1:N
                           ▼
┌─────────────────────────────────────────────────────┐
│                   attempt_answers                   │
│   (id, attempt_id, question_id, selected_choice_id) │
└─────────────────────────────────────────────────────┘
```

## 2. Danh sách các Bảng Dữ Liệu

### 2.1. Bảng `categories` (Danh mục bài thi)
- `id`: INT AUTO_INCREMENT PRIMARY KEY.
- `name`: VARCHAR(100) NOT NULL UNIQUE - Tên danh mục (5 danh mục chuẩn).
- `slug`: VARCHAR(100) NOT NULL UNIQUE - Định danh URL thân thiện.
- `description`: TEXT NULL - Mô tả định hướng nội dung của danh mục.
- `order_num`: INT NOT NULL DEFAULT 1 - Thứ tự sắp xếp hiển thị.
- `created_at`, `updated_at`: TIMESTAMP.

### 2.2. Bảng `users` (Người dùng)
- `id`: INT AUTO_INCREMENT PRIMARY KEY.
- `username`: VARCHAR(50) UNIQUE, NOT NULL - Tên đăng nhập.
- `email`: VARCHAR(100) UNIQUE, NOT NULL - Hộp thư điện tử.
- `password_hash`: VARCHAR(255) NOT NULL - Chuỗi băm mật khẩu Bcrypt có Salt.
- `full_name`: VARCHAR(100) NOT NULL - Họ và tên hiển thị.
- `role`: ENUM('admin', 'student') NOT NULL DEFAULT 'student'.
- `token_version`: INT NOT NULL DEFAULT 1 - Phiên bản token dùng cho Token Revocation khi logout.
- `created_at`, `updated_at`: TIMESTAMP.

### 2.3. Bảng `exams` (Đề thi)
- `id`: INT AUTO_INCREMENT PRIMARY KEY.
- `title`: VARCHAR(255) NOT NULL - Tiêu đề bài thi.
- `description`: TEXT - Hướng dẫn / mô tả bài thi.
- `category_id`: INT NULL, FOREIGN KEY REFERENCES categories(id) ON DELETE RESTRICT.
- `duration_minutes`: INT NOT NULL DEFAULT 15 - Thời lượng làm bài (phút).
- `passing_score`: DECIMAL(4, 2) NOT NULL DEFAULT 5.00 - Điểm chuẩn đạt (thang 10).
- `status`: ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft'.
- `created_by`: INT NOT NULL, FOREIGN KEY REFERENCES users(id).
- `created_at`, `updated_at`: TIMESTAMP.

### 2.4. Bảng `questions` (Câu hỏi)
- `id`: INT AUTO_INCREMENT PRIMARY KEY.
- `exam_id`: INT NOT NULL, FOREIGN KEY REFERENCES exams(id) ON DELETE CASCADE.
- `question_text`: TEXT NOT NULL - Nội dung câu hỏi.
- `explanation`: TEXT NULL - Lời giải thích cặn kẽ sau khi nộp bài.
- `order_num`: INT NOT NULL DEFAULT 1.

### 2.4. Bảng `choices` (Lựa chọn trả lời)
- `id`: INT AUTO_INCREMENT PRIMARY KEY.
- `question_id`: INT NOT NULL, FOREIGN KEY REFERENCES questions(id) ON DELETE CASCADE.
- `choice_text`: VARCHAR(500) NOT NULL - Nội dung phương án.
- `is_correct`: TINYINT(1) NOT NULL DEFAULT 0 - Cờ đánh dấu đáp án đúng.
- `order_num`: INT NOT NULL DEFAULT 1.

### 2.5. Bảng `attempts` (Lượt thi của thí sinh)
- `id`: INT AUTO_INCREMENT PRIMARY KEY.
- `user_id`: INT NOT NULL, FOREIGN KEY REFERENCES users(id).
- `exam_id`: INT NOT NULL, FOREIGN KEY REFERENCES exams(id).
- `exam_snapshot_json`: LONGTEXT NOT NULL - **Cơ chế Snapshot bảo vệ tính bất biến**: Lưu lại toàn bộ nội dung đề, danh sách câu hỏi và các lựa chọn đáp án tại thời điểm thí sinh bấm bắt đầu thi. Khi giáo viên sửa hoặc xóa câu hỏi trong đề gốc, lịch sử và điểm số của lượt thi này hoàn toàn không bị ảnh hưởng.
- `total_questions`: INT NOT NULL - Tổng số câu hỏi của lượt thi.
- `started_at`: TIMESTAMP NOT NULL - Thời điểm bắt đầu trên server.
- `due_at`: TIMESTAMP NOT NULL - Thời điểm kết thúc quy định trên server.
- `submitted_at`: TIMESTAMP NULL - Thời điểm nộp bài thực tế.
- `status`: ENUM('in_progress', 'completed', 'timed_out') NOT NULL DEFAULT 'in_progress'.
- `score`: DECIMAL(4, 2) NULL - Điểm số (thang 10).
- `correct_count`: INT NOT NULL DEFAULT 0 - Số câu trả lời đúng.
- `is_passed`: TINYINT(1) NULL - Kết quả Đạt (1) / Chưa đạt (0).

### 2.6. Bảng `attempt_answers` (Tiến độ câu trả lời của thí sinh)
- `id`: INT AUTO_INCREMENT PRIMARY KEY.
- `attempt_id`: INT NOT NULL, FOREIGN KEY REFERENCES attempts(id) ON DELETE CASCADE.
- `question_id`: INT NOT NULL, FOREIGN KEY REFERENCES questions(id).
- `selected_choice_id`: INT NULL, FOREIGN KEY REFERENCES choices(id).
- `is_correct`: TINYINT(1) NULL - Kết quả sau khi chấm tự động.
- `answered_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- Ràng buộc: `UNIQUE KEY uq_attempt_question (attempt_id, question_id)`.

## 3. Cơ chế Khóa và An toàn Giao dịch (Transactions & Concurrency)
- Thao tác nộp bài `submitAttempt` sử dụng `SELECT ... FOR UPDATE` trong Transaction của MySQL InnoDB. Điều này ngăn chặn hoàn toàn race condition nếu người dùng bấm nộp nhiều lần hoặc mở nhiều tab cùng lúc.
- Khi một lượt thi chuyển sang `completed` hoặc `timed_out`, điểm số được khóa cố định, mọi yêu cầu nộp lặp lại chỉ trả về kết quả đã chốt mà không tính toán lại.
