# -*- coding: utf-8 -*-
"""
Tạo bộ dữ liệu 15 đề thi mẫu (150 câu hỏi, 600 lựa chọn)
Tuân thủ:
- Giữ nguyên ID và nội dung của đề 1, 2, 3
- Đề 1 (id=1): Tổng quan triển khai & quản trị HTPM (Category 1)
- Đề 2 (id=2): XSS, SQL Injection & CSRF (Category 2)
- Đề 3 (id=3): Mạng máy tính & giao thức Internet (Category 3)
- Bổ sung 12 đề còn lại (id: 11, 12, 21, 22, 31, 32, 41, 42, 43, 51, 52, 53)
- Mỗi đề đúng 10 câu hỏi, 4 lựa chọn, đúng 1 đáp án đúng
- Vị trí đáp án đúng được phân bố đều A, B, C, D (2-3 câu mỗi vị trí)
- Tiếng Việt UTF-8 chuẩn xác, giải thích chi tiết
"""

import json
import re

categories = [
    {
        "id": 1,
        "name": "Triển khai & Quản trị Hệ thống",
        "slug": "trien-khai-quan-tri-he-thong",
        "description": "Các bài thi về tổng quan HTPM, Container Docker, Docker Compose, Nginx Reverse Proxy, Prometheus, Grafana và Loki.",
        "order_num": 1
    },
    {
        "id": 2,
        "name": "An toàn Thông tin",
        "slug": "an-toan-thong-tin",
        "description": "Bảo mật ứng dụng Web, OWASP Top 10, phòng chống XSS, SQL Injection, CSRF, cấu hình Security Headers và quản trị phân quyền.",
        "order_num": 2
    },
    {
        "id": 3,
        "name": "Mạng Máy tính",
        "slug": "mang-may-tinh",
        "description": "Kiến thức mô hình OSI, TCP/IP, địa chỉ IP subnet, định tuyến, DNS, giao thức HTTP/HTTPS, SSL/TLS và Reverse Proxy.",
        "order_num": 3
    },
    {
        "id": 4,
        "name": "Cơ sở Dữ liệu",
        "slug": "co-so-du-lieu",
        "description": "Cơ sở dữ liệu quan hệ MySQL, ngôn ngữ SQL, truy vấn JOIN, GROUP BY, Transaction ACID, tối ưu Index và chiến lược sao lưu dữ liệu.",
        "order_num": 4
    },
    {
        "id": 5,
        "name": "Lập trình Web",
        "slug": "lap-trinh-web",
        "description": "Nền tảng phát triển Web với HTML5, CSS3 hiện đại, JavaScript ES6+, DOM Events, Node.js, Express và kiến trúc chuẩn RESTful API.",
        "order_num": 5
    }
]

# Danh sách 15 đề thi
exams = [
    # Danh mục 1: Triển khai & Quản trị Hệ thống
    {
        "id": 1,
        "category_id": 1,
        "title": "Tổng quan Triển khai & Quản trị HTPM",
        "description": "Kiểm tra hiểu biết nền tảng về quy trình triển khai phần mềm, môi trường staging/production, Reverse Proxy, monitoring và logging.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 11,
        "category_id": 1,
        "title": "Docker & Docker Compose",
        "description": "Kiến thức cốt lõi về Docker Image, Container lifecycle, Dockerfile tối ưu, Docker Compose networking, volumes và healthcheck.",
        "duration_minutes": 20,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 12,
        "category_id": 1,
        "title": "Giám sát, Logging & Hardening",
        "description": "Kiến thức chuyên sâu về hệ thống giám sát Prometheus, Dashboard Grafana, thu thập log Loki/Promtail và kỹ thuật bảo mật container.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },

    # Danh mục 2: An toàn Thông tin
    {
        "id": 21,
        "category_id": 2,
        "title": "Tổng quan Bảo mật Web",
        "description": "Kiến thức nền tảng về mô hình CIA, OWASP Top 10, nguyên tắc Least Privilege, mã hóa dữ liệu at-rest/in-transit và quản lý lỗ hổng bảo mật.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 2,
        "category_id": 2,
        "title": "XSS, SQL Injection & CSRF",
        "description": "Kiểm tra về bảo mật Web OWASP Top 10, cơ chế tấn công và phòng vệ XSS, CSRF, SQL Injection, Security Headers và mã hóa.",
        "duration_minutes": 20,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 22,
        "category_id": 2,
        "title": "Xác thực, Phân quyền & Bảo vệ Dữ liệu",
        "description": "Kiến thức về JWT Authentication, Session Cookies, RBAC phân quyền người dùng, Token Revocation, băm mật khẩu Bcrypt và chống rò rỉ dữ liệu.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },

    # Danh mục 3: Mạng Máy tính
    {
        "id": 3,
        "category_id": 3,
        "title": "Mạng Máy tính & Giao thức Internet",
        "description": "Kiến thức mô hình OSI 7 tầng, TCP/IP 4 tầng, chức năng các tầng mạng, giao thức truyền thông phổ biến và đơn vị dữ liệu PDU.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 31,
        "category_id": 3,
        "title": "Địa chỉ IP, TCP/UDP & DNS",
        "description": "Phân biệt IPv4/IPv6, chia subnet CIDR, địa chỉ Private/Public IP, bắt tay 3 bước TCP vs UDP không kết nối và cơ chế phân giải tên miền DNS.",
        "duration_minutes": 20,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 32,
        "category_id": 3,
        "title": "HTTP/HTTPS, TLS & Reverse Proxy",
        "description": "Cấu trúc gói tin HTTP request/response, mã trạng thái HTTP, quá trình TLS/SSL Handshake, vai trò Nginx Reverse Proxy và Load Balancing.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },

    # Danh mục 4: Cơ sở Dữ liệu
    {
        "id": 41,
        "category_id": 4,
        "title": "Cơ sở Dữ liệu Quan hệ & SQL",
        "description": "Các khái niệm RDBMS, khóa chính (Primary Key), khóa ngoại (Foreign Key), ràng buộc toàn vẹn dữ liệu và câu lệnh DDL/DML cơ bản.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 42,
        "category_id": 4,
        "title": "Truy vấn JOIN, GROUP BY & Truy vấn Con",
        "description": "Kỹ năng viết câu truy vấn INNER JOIN, LEFT JOIN, gom nhóm với GROUP BY, lọc nhóm với HAVING và kỹ thuật Subquery lồng nhau.",
        "duration_minutes": 20,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 43,
        "category_id": 4,
        "title": "Transaction, Index & Sao lưu",
        "description": "Bốn tính chất ACID của giao dịch, các mức cô lập Isolation Levels, cấu trúc B-Tree Index, phòng tránh Deadlock và chiến lược Backup MySQL.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },

    # Danh mục 5: Lập trình Web
    {
        "id": 51,
        "category_id": 5,
        "title": "HTML & CSS Cơ bản",
        "description": "Cấu trúc tài liệu HTML5 ngữ nghĩa, thẻ biểu mẫu form, mô hình hộp CSS Box Model, bố cục Flexbox, CSS Grid và nguyên lý Responsive Design.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 52,
        "category_id": 5,
        "title": "JavaScript & DOM",
        "description": "Kiểu dữ liệu ES6, Scope biến (let/const), Event Loop, Callback, Promise, Async/Await, thao tác DOM Tree và kỹ thuật Event Delegation.",
        "duration_minutes": 20,
        "passing_score": 5.0,
        "status": "published"
    },
    {
        "id": 53,
        "category_id": 5,
        "title": "Node.js, Express & REST API",
        "description": "Kiến trúc Non-blocking I/O Node.js, Express Router, luồng Middleware xử lý request, thiết kế chuẩn RESTful API, mã lỗi HTTP và CORS.",
        "duration_minutes": 15,
        "passing_score": 5.0,
        "status": "published"
    }
]

print("Exams defined:", len(exams))

