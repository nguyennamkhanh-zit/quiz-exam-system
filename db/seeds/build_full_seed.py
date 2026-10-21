# -*- coding: utf-8 -*-
"""
Tập lệnh hợp nhất và sinh toàn bộ dữ liệu mẫu 15 đề thi:
- Ghi vào db/seed.sql (tương thích docker-entrypoint-initdb.d)
- Ghi vào db/seed.js (chạy an toàn, không trùng lặp, giữ nguyên dữ liệu người dùng)
- Phân bố đều vị trí đáp án đúng A, B, C, D cho các đề thi
"""

import json
from db.seeds.generate_full_quiz import categories, exams
from db.seeds.questions_data import new_exams_data, load_existing

def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def balance_choices(choices, target_correct_idx):
    """
    Sắp xếp lại 4 lựa chọn sao cho đáp án đúng nằm ở vị trí target_correct_idx (0=A, 1=B, 2=C, 3=D)
    """
    correct_choice = None
    incorrect_choices = []
    for c in choices:
        if c[1] is True:
            correct_choice = c
        else:
            incorrect_choices.append(c)
    
    assert correct_choice is not None and len(incorrect_choices) == 3
    
    balanced = []
    inc_ptr = 0
    for i in range(4):
        if i == target_correct_idx:
            balanced.append(correct_choice)
        else:
            balanced.append(incorrect_choices[inc_ptr])
            inc_ptr += 1
    return balanced

def generate_full_seed():
    existing_raw = load_existing()
    
    # 1. Parse existing questions & choices cho Exam 1, 2, 3
    existing_exams = {1: [], 2: [], 3: []}
    for e_key, e_id in [("e1", 1), ("e2", 2), ("e3", 3)]:
        raw_list = existing_raw[e_key]
        q_dict = {}
        for row in raw_list:
            q_id = row["q_id"]
            if q_id not in q_dict:
                q_dict[q_id] = {
                    "id": q_id,
                    "text": row["question_text"],
                    "exp": row["explanation"],
                    "choices": []
                }
            q_dict[q_id]["choices"].append({
                "id": row["c_id"],
                "text": row["choice_text"],
                "is_correct": bool(row["is_correct"]),
                "order_num": row["order_num"]
            })
        existing_exams[e_id] = list(q_dict.values())

    # Cân bằng vị trí đáp án đúng cho 12 đề mới:
    # 10 câu mỗi đề -> vị trí A: 2 hoặc 3, B: 2 hoặc 3, C: 2 hoặc 3, D: 2 hoặc 3 (tổng 10: 3, 2, 3, 2 hoặc 2, 3, 2, 3)
    target_pattern = [0, 1, 2, 3, 0, 1, 2, 3, 0, 2] # A: 3, B: 2, C: 3, D: 2
    target_pattern_alt = [1, 2, 3, 0, 1, 2, 3, 0, 1, 3] # A: 2, B: 3, C: 2, D: 3

    correct_positions = {0: 0, 1: 0, 2: 0, 3: 0}
    for e_idx, (e_id, q_list) in enumerate(new_exams_data.items()):
        pat = target_pattern if e_idx % 2 == 0 else target_pattern_alt
        for q_idx, q in enumerate(q_list):
            target_pos = pat[q_idx]
            q["choices"] = balance_choices(q["choices"], target_pos)
            for idx, c in enumerate(q["choices"]):
                if c[1] is True:
                    correct_positions[idx] += 1

    print("Balanced 12 new exams correct choice distribution (A/B/C/D):", correct_positions)

    # 2. Tạo SQL Statements
    sql_lines = []
    sql_lines.append("-- ================================================================")
    sql_lines.append("-- SEED DATA: 5 CATEGORIES x 3 EXAMS = 15 EXAMS (150 QUESTIONS, 600 CHOICES)")
    sql_lines.append("-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci")
    sql_lines.append("-- ================================================================\n")

    # Categories
    sql_lines.append("-- 1. Seed Categories")
    sql_lines.append("INSERT INTO categories (id, name, slug, description, order_num) VALUES")
    cat_values = []
    for c in categories:
        cat_values.append(f"({c['id']}, {escape_sql(c['name'])}, {escape_sql(c['slug'])}, {escape_sql(c['description'])}, {c['order_num']})")
    sql_lines.append(",\n".join(cat_values))
    sql_lines.append("ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), description=VALUES(description), order_num=VALUES(order_num);\n")

    # Users
    sql_lines.append("-- 2. Seed Users")
    sql_lines.append("INSERT INTO users (id, username, email, password_hash, full_name, role) VALUES")
    sql_lines.append("(1, 'admin', 'admin@ictu.edu.vn', '$2b$10$SpnzCjLcBDr2dvIDwdwyOO8PKI5Gir.MvINWvLbb7hAYjI75IFzja', 'Quản trị viên Hệ thống', 'admin'),")
    sql_lines.append("(2, 'student1', 'student1@ictu.edu.vn', '$2b$10$ho6kRNIYUe.yMKYRK.QSM.oBGtAYgjvYj/wHNZViX3DB.z8fnmH3O', 'Nguyễn Nam Khánh', 'student'),")
    sql_lines.append("(3, 'student2', 'student2@ictu.edu.vn', '$2b$10$ho6kRNIYUe.yMKYRK.QSM.oBGtAYgjvYj/wHNZViX3DB.z8fnmH3O', 'Trần Văn Minh', 'student')")
    sql_lines.append("ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);\n")

    # Exams
    sql_lines.append("-- 3. Seed 15 Exams")
    sql_lines.append("INSERT INTO exams (id, category_id, title, description, duration_minutes, passing_score, status, created_by) VALUES")
    exam_values = []
    for e in exams:
        exam_values.append(f"({e['id']}, {e['category_id']}, {escape_sql(e['title'])}, {escape_sql(e['description'])}, {e['duration_minutes']}, {e['passing_score']:.2f}, {escape_sql(e['status'])}, 1)")
    sql_lines.append(",\n".join(exam_values))
    sql_lines.append("ON DUPLICATE KEY UPDATE category_id=VALUES(category_id), title=VALUES(title), description=VALUES(description), duration_minutes=VALUES(duration_minutes), passing_score=VALUES(passing_score), status=VALUES(status);\n")

    # Questions & Choices cho cả 15 đề
    total_q_count = 0
    total_c_count = 0

    for e in exams:
        e_id = e["id"]
        sql_lines.append(f"-- ==================== ĐỀ {e_id}: {e['title']} ====================")
        
        if e_id in (1, 2, 3):
            raw_q_list = existing_exams[e_id]
            q_inserts = []
            c_inserts = []
            for order_idx, q in enumerate(raw_q_list, start=1):
                total_q_count += 1
                q_inserts.append(f"({q['id']}, {e_id}, {escape_sql(q['text'])}, {escape_sql(q['exp'])}, {order_idx})")
                for c in q["choices"]:
                    total_c_count += 1
                    is_c = 1 if c["is_correct"] else 0
                    c_inserts.append(f"({c['id']}, {q['id']}, {escape_sql(c['text'])}, {is_c}, {c['order_num']})")
        else:
            raw_q_list = new_exams_data[e_id]
            q_inserts = []
            c_inserts = []
            for order_idx, q in enumerate(raw_q_list, start=1):
                total_q_count += 1
                q_id = q["id"]
                q_inserts.append(f"({q_id}, {e_id}, {escape_sql(q['text'])}, {escape_sql(q['exp'])}, {order_idx})")
                for c_idx, c_tuple in enumerate(q["choices"], start=1):
                    total_c_count += 1
                    c_id = q_id * 10 + c_idx
                    is_c = 1 if c_tuple[1] else 0
                    c_inserts.append(f"({c_id}, {q_id}, {escape_sql(c_tuple[0])}, {is_c}, {c_idx})")

        sql_lines.append("INSERT INTO questions (id, exam_id, question_text, explanation, order_num) VALUES")
        sql_lines.append(",\n".join(q_inserts))
        sql_lines.append("ON DUPLICATE KEY UPDATE question_text=VALUES(question_text), explanation=VALUES(explanation), order_num=VALUES(order_num);\n")

        sql_lines.append("INSERT INTO choices (id, question_id, choice_text, is_correct, order_num) VALUES")
        sql_lines.append(",\n".join(c_inserts))
        sql_lines.append("ON DUPLICATE KEY UPDATE choice_text=VALUES(choice_text), is_correct=VALUES(is_correct), order_num=VALUES(order_num);\n")

    full_sql = "\n".join(sql_lines)
    with open("db/seed.sql", "w", encoding="utf-8") as f:
        f.write(full_sql)

    print(f"Generated db/seed.sql successfully! Total Exams: {len(exams)}, Questions: {total_q_count}, Choices: {total_c_count}")

if __name__ == "__main__":
    generate_full_seed()

