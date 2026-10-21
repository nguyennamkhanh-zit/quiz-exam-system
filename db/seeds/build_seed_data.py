import json
import os

# Cấu hình 5 danh mục
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

print("Categories count:", len(categories))

