-- Database Schema for Quiz Exam System
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
    token_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    order_num INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NULL,
    duration_minutes INT NOT NULL DEFAULT 15,
    passing_score DECIMAL(4, 2) NOT NULL DEFAULT 5.00,
    status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_exam_category (category_id),
    INDEX idx_exam_status (status),
    INDEX idx_exam_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_text TEXT NOT NULL,
    explanation TEXT NULL,
    order_num INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    INDEX idx_question_exam (exam_id, order_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS choices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    choice_text VARCHAR(500) NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    order_num INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_choice_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lượt thi của thí sinh
CREATE TABLE IF NOT EXISTS attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_id INT NOT NULL,
    exam_snapshot_json LONGTEXT NOT NULL COMMENT 'Bản chụp đề thi, câu hỏi và đáp án tại thời điểm bắt đầu thi để bảo đảm bất biến',
    total_questions INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP NULL,
    status ENUM('in_progress', 'completed', 'timed_out') NOT NULL DEFAULT 'in_progress',
    score DECIMAL(4, 2) NULL,
    correct_count INT NOT NULL DEFAULT 0,
    is_passed TINYINT(1) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE RESTRICT,
    INDEX idx_attempt_user (user_id),
    INDEX idx_attempt_exam (exam_id),
    INDEX idx_attempt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Câu trả lời chi tiết cho từng câu trong lượt thi
CREATE TABLE IF NOT EXISTS attempt_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_choice_id INT NULL,
    is_correct TINYINT(1) NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attempt_question (attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT,
    FOREIGN KEY (selected_choice_id) REFERENCES choices(id) ON DELETE SET NULL,
    INDEX idx_attempt_ans_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu trữ token đặt lại mật khẩu an toàn
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lưu trữ nhật ký hoạt động (Audit Logs) bền vững cho Admin
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50) NULL,
    role VARCHAR(20) NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NULL,
    details TEXT NULL,
    status ENUM('success', 'failure') NOT NULL DEFAULT 'success',
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_action (action),
    INDEX idx_audit_status (status),
    INDEX idx_audit_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


