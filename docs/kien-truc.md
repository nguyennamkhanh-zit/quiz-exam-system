# Kiến Trúc Hệ Thống & Triển Khai Docker Compose

## 1. Sơ đồ Kiến trúc Tổng thể (Architecture Diagram)

```
[ Client Trình Duyệt ]
        │
        │ HTTP (Port 18095)
        ▼
┌─────────────────────────────────────────────────────────────┐
│ Nginx Reverse Proxy (Cổng 18095 -> Container Port 80)        │
│ - Security Headers (CSP, X-Frame-Options, XSS, nosniff)     │
│ - Giới hạn kích thước Body (2M), Rate Limiting              │
│ - Che giấu phiên bản Nginx (server_tokens off)             │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
      / (Web & API Proxy)              /stub_status (Internal Only)
               ▼                              ▼
┌──────────────────────────────┐  ┌───────────────────────────┐
│ App Service (Node.js Express)│  │ Nginx Prometheus Exporter │
│ - Port 18095 nội bộ          │  │ - Port 9113               │
│ - User: node (Non-Root)      │  └─────────────┬─────────────┘
│ - Endpoint /metrics          │                │
│ - Endpoint /health           │                │
└──────────────┬───────────────┘                │
               │                                │
               │ MySQL Protocol                 │
               ▼                                │
┌──────────────────────────────┐                │
│ MySQL Database 8.4 LTS       │                │
│ - Internal Port 3306         │                │
│ - Named Volume mysql_data    │                │
└──────────────┬───────────────┘                │
               │                                │
               ▼                                │
┌──────────────────────────────┐                │
│ MySQL Prometheus Exporter    │                │
│ - Port 9104                  │                │
└──────────────┬───────────────┘                │
               │                                │
               └───────────────┬────────────────┘
                               │ Scrape Metrics (Mỗi 15s)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Prometheus Server (Port 19095 trên 127.0.0.1)               │
│ - Lưu trữ TSDB Time-series                                  │
│ - Giám sát App, Nginx, MySQL, Container                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Datasource
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Grafana Dashboard (Port 18097 trên 127.0.0.1)               │
│ - Tự động Provision Datasource & Dashboards qua code       │
│ - Hiển thị biểu đồ Metrics & Logs trực quan                 │
└──────────────────────────────▲──────────────────────────────┘
                               │
                               │ Datasource Loki
┌──────────────────────────────┴──────────────────────────────┐
│ Loki Server (Port 13105 trên 127.0.0.1)                     │
│ - Lưu trữ Log tập trung tối ưu index metadata               │
└──────────────────────────────▲──────────────────────────────┘
                               │ Push Logs qua HTTP
┌──────────────────────────────┴──────────────────────────────┐
│ Promtail Agent                                              │
│ - Đọc Log từ Named Volumes: app_logs và nginx_logs         │
│ - Gắn nhãn metadata tĩnh: project=quiz-exam-system, service │
└─────────────────────────────────────────────────────────────┘
```

## 2. Danh mục dịch vụ và phân bổ cổng (Port Allocation)

| Dịch vụ | Image | Cổng Container | Cổng Host (Đã kiểm tra an toàn) | Mục đích |
|---|---|---|---|---|
| **nginx** | `nginx:1.27-alpine` | `80` | `18095` (0.0.0.0) | Cổng chính truy cập website của người dùng |
| **app** | `quiz-exam-app:1.0.0` | `18095` | Nội bộ (`quiz_internal`) | Máy chủ ứng dụng Express, chạy non-root user `node` |
| **mysql** | `mysql:8.4` | `3306` | `127.0.0.1:13325` | Cơ sở dữ liệu chính, bảo vệ chỉ bind localhost |
| **phpmyadmin** | `phpmyadmin:5.2.3-apache` | `80` | `127.0.0.1:18096` | Quản trị giao diện DB web |
| **prometheus** | `prom/prometheus:v3.1.0` | `9090` | `127.0.0.1:19095` | Thu thập và lưu trữ metrics định kỳ |
| **grafana** | `grafana/grafana:11.4.0` | `3000` | `127.0.0.1:18097` | Trực quan hóa bảng điều khiển giám sát |
| **loki** | `grafana/loki:3.3.2` | `3100` | `127.0.0.1:13105` | Máy chủ lưu trữ log tập trung |
| **promtail** | `grafana/promtail:3.3.2` | `9080` | Nội bộ | Agent thu thập log và đẩy về Loki |
| **nginx-exporter** | `nginx/nginx-prometheus-exporter:1.4.1` | `9113` | Nội bộ | Xuất chỉ số connection/status Nginx |
| **mysql-exporter** | `prom/mysqld-exporter:v0.16.0` | `9104` | Nội bộ | Xuất chỉ số truy vấn/connection MySQL |

## 3. Tính độc lập và an toàn hệ thống
- Mọi dịch vụ được cô lập trong Docker Network riêng biệt: `quiz_internal`.
- Tránh tuyệt đối xung đột với các hệ thống khác (Grafana cổng 3000, Nginx 18090, MySQL 3306/3307/3308 trên máy tính).
- Toàn bộ dữ liệu quan trọng lưu trữ trong Named Volumes riêng biệt của dự án, không bao giờ mất khi tắt bật hoặc tạo lại container.
