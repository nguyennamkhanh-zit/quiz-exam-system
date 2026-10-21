# -*- coding: utf-8 -*-
"""
Tập hợp toàn bộ câu hỏi và lựa chọn cho 15 đề thi:
- Đề 1, 2, 3: Đọc lại từ db/seeds/existing_1_2_3.json để bảo toàn tuyệt đối ID và nội dung hiện có
- Đề 11, 12: Danh mục 1
- Đề 21, 22: Danh mục 2
- Đề 31, 32: Danh mục 3
- Đề 41, 42, 43: Danh mục 4
- Đề 51, 52, 53: Danh mục 5
"""

import json

def load_existing():
    with open("db/seeds/existing_1_2_3.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

# Dữ liệu 12 đề thi mới được biên soạn kỹ lưỡng, chuẩn kiến thức thực tế
new_exams_data = {
    # -------------------------------------------------------------
    # ĐỀ 11: Docker & Docker Compose (Category 1)
    # -------------------------------------------------------------
    11: [
        {
            "id": 1101,
            "text": "Lệnh Docker nào sau đây được dùng để xóa tất cả các container đã dừng hoạt động một cách nhanh chóng?",
            "exp": "Lệnh docker container prune xóa toàn bộ container có trạng thái stopped trong hệ thống.",
            "choices": [
                ("docker container rm $(docker ps -a -q)", False),
                ("docker container prune", True),
                ("docker system stop --all", False),
                ("docker delete stopped", False)
            ]
        },
        {
            "id": 1102,
            "text": "Trong Dockerfile, chỉ thị nào sau đây được khuyến nghị để giảm kích thước image thông qua mô hình Multi-stage build?",
            "exp": "Multi-stage build sử dụng nhiều chỉ thị FROM trong cùng một Dockerfile và sao chép artifact thông qua COPY --from=builder.",
            "choices": [
                ("Sử dụng nhiều chỉ thị FROM trong cùng một Dockerfile", True),
                ("Dùng chỉ thị EXPOSE kết hợp VOLUME", False),
                ("Chỉ dùng lệnh RUN apt-get clean ở cuối", False),
                ("Tăng kích thước RAM khi build với cờ -m", False)
            ]
        },
        {
            "id": 1103,
            "text": "Sự khác biệt căn bản giữa hai chỉ thị ENTRYPOINT và CMD trong Dockerfile là gì?",
            "exp": "ENTRYPOINT định nghĩa lệnh chính thực thi cố định của container, trong khi CMD cung cấp tham số mặc định có thể bị ghi đè khi chạy docker run.",
            "choices": [
                ("CMD không thể bị ghi đè từ dòng lệnh docker run", False),
                ("ENTRYPOINT là lệnh cố định, CMD cung cấp đối số mặc định có thể bị ghi đè", True),
                ("ENTRYPOINT chỉ chạy trong môi trường build, CMD chạy trong môi trường run", False),
                ("Cả hai chỉ thị hoàn toàn giống nhau, chỉ khác tên gọi cú pháp", False)
            ]
        },
        {
            "id": 1104,
            "text": "Trong Docker Compose, thuộc tính nào định nghĩa sự phụ thuộc khởi động giữa các dịch vụ và điều kiện sẵn sàng?",
            "exp": "Thuộc tính depends_on kết hợp condition: service_healthy giúp bảo đảm dịch vụ chỉ khởi động sau khi dịch vụ phụ thuộc đã vượt qua healthcheck.",
            "choices": [
                ("links", False),
                ("external_links", False),
                ("depends_on với condition: service_healthy", True),
                ("restart: always", False)
            ]
        },
        {
            "id": 1105,
            "text": "Khi khai báo network trong docker-compose.yml, driver mặc định nào được Docker Compose tự động thiết lập?",
            "exp": "Mặc định Docker Compose tạo một mạng nội bộ loại bridge cho các container cùng project giao tiếp.",
            "choices": [
                ("host", False),
                ("overlay", False),
                ("macvlan", False),
                ("bridge", True)
            ]
        },
        {
            "id": 1106,
            "text": "Named Volume trong Docker Compose có ưu điểm gì vượt trội so với Bind Mount?",
            "exp": "Named Volume được Docker quản lý độc lập tại thư mục hệ thống /var/lib/docker/volumes/, tăng hiệu năng I/O và an toàn phân quyền hơn bind mount host.",
            "choices": [
                ("Được Docker quản lý độc lập, tối ưu hiệu năng I/O và cách ly an toàn", True),
                ("Cho phép sửa trực tiếp code từ máy host mà không cần rebuild", False),
                ("Tự động đồng bộ dữ liệu lên dịch vụ đám mây AWS S3", False),
                ("Không chiếm dung lượng ổ đĩa của máy chủ", False)
            ]
        },
        {
            "id": 1107,
            "text": "Lệnh nào sau đây kiểm tra cú pháp và hiển thị cấu hình Docker Compose đã giải quyết biến môi trường?",
            "exp": "docker compose config kiểm tra hợp lệ file compose và in ra cấu hình hoàn chỉnh sau khi thay thế các biến môi trường.",
            "choices": [
                ("docker compose validate", False),
                ("docker compose test", False),
                ("docker compose config", True),
                ("docker compose inspect", False)
            ]
        },
        {
            "id": 1108,
            "text": "Chỉ thị USER trong Dockerfile có vai trò quan trọng nào đối với an ninh hệ thống?",
            "exp": "Chỉ thị USER chỉ định người dùng non-root (không đặc quyền) chạy tiến trình container, hạn chế nguy cơ container breakout chiếm quyền root của host.",
            "choices": [
                ("Tạo tài khoản đăng nhập SSH cho quản trị viên", False),
                ("Quy định người sở hữu giấy phép mã nguồn", False),
                ("Chạy ứng dụng với tài khoản non-root để hạn chế rủi ro bảo mật", True),
                ("Đặt tên hiển thị của tác giả container", False)
            ]
        },
        {
            "id": 1109,
            "text": "File .dockerignore được sử dụng nhằm mục đích chính nào trong quá trình build image?",
            "exp": ".dockerignore loại trừ các file/thư mục không cần thiết (node_modules, .git, .env) khỏi build context, giúp giảm dung lượng gửi tới Docker Daemon và tránh lộ bí mật.",
            "choices": [
                ("Ngăn chặn Docker quét virus trong mã nguồn", False),
                ("Loại trừ các file không cần thiết khỏi build context để tăng tốc và bảo mật", True),
                ("Tự động xóa image cũ khi hết dung lượng đĩa", False),
                ("Chặn các container khác truy cập vào thư mục mã nguồn", False)
            ]
        },
        {
            "id": 1110,
            "text": "Cờ nào trong lệnh docker compose up buộc build lại toàn bộ image từ Dockerfile mà không dùng cache?",
            "exp": "Tùy chọn --build buộc Docker Compose build lại image, và có thể kết hợp cờ --no-cache để bỏ qua lớp cache cũ.",
            "choices": [
                ("docker compose up --force-recreate", False),
                ("docker compose up --fresh", False),
                ("docker compose up --build", True),
                ("docker compose up --reload", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 12: Giám sát, Logging & Hardening (Category 1)
    # -------------------------------------------------------------
    12: [
        {
            "id": 1201,
            "text": "Prometheus thu thập dữ liệu chỉ số (metrics) từ các ứng dụng mục tiêu theo giao thức và cơ chế nào?",
            "exp": "Prometheus sử dụng mô hình Pull (kéo dữ liệu) định kỳ qua giao thức HTTP/HTTPS tại endpoint chuẩn (thường là /metrics).",
            "choices": [
                ("HTTP/HTTPS theo cơ chế kéo (Pull mechanism)", True),
                ("UDP Broadcast gửi tin liên tục", False),
                ("WebSocket kết nối hai chiều thời gian thực", False),
                ("Giao thức hàng đợi tin nhắn MQTT", False)
            ]
        },
        {
            "id": 1202,
            "text": "Trong kiến trúc giám sát của Grafana Loki, Promtail giữ vai trò chức năng gì?",
            "exp": "Promtail là một tác nhân (agent) đọc các file log trên máy chủ cục bộ hoặc container, đính nhãn metadata và gửi về Loki.",
            "choices": [
                ("Lưu trữ và đánh chỉ mục toàn văn cơ sở dữ liệu", False),
                ("Tác nhân thu thập file log và chuyển tiếp về Loki", True),
                ("Hiển thị giao diện biểu đồ trực quan hóa số liệu", False),
                ("Gửi email cảnh báo sự cố cho đội ngũ vận hành", False)
            ]
        },
        {
            "id": 1203,
            "text": "Điểm khác biệt then chốt giữa Grafana Loki và Elasticsearch trong lưu trữ log là gì?",
            "exp": "Loki chỉ đánh chỉ mục (index) các nhãn metadata (labels) mà không đánh chỉ mục toàn bộ nội dung text, giúp tiết kiệm bộ nhớ và lưu trữ vượt trội.",
            "choices": [
                ("Loki đánh chỉ mục từng từ khóa trong thông điệp log", False),
                ("Loki chỉ đánh chỉ mục metadata/labels, giúp tối ưu dung lượng lưu trữ", True),
                ("Loki không hỗ trợ tìm kiếm theo mốc thời gian", False),
                ("Loki yêu cầu cấu hình cụm máy chủ phân tán tối thiểu 5 node", False)
            ]
        },
        {
            "id": 1204,
            "text": "Công cụ cAdvisor của Google thường được tích hợp trong stack Docker để giám sát thông số nào?",
            "exp": "cAdvisor phân tích và thu thập các chỉ số sử dụng tài nguyên phần cứng thời gian thực của container như CPU, RAM, Network I/O và Disk I/O.",
            "choices": [
                ("Lỗ hổng bảo mật trong mã nguồn ứng dụng", False),
                ("Chỉ số phần cứng container như CPU, RAM, Network I/O", True),
                ("Lịch sử commit và thay đổi trong kho Git", False),
                ("Số lượng truy vấn SQL SELECT chậm", False)
            ]
        },
        {
            "id": 1205,
            "text": "Biện pháp Hardening nào sau đây giúp hạn chế tối đa rủi ro tấn công leo thang đặc quyền trong Docker?",
            "exp": "Thiết lập cờ security_opt: [no-new-privileges:true] và cấp phát user non-root ngăn tiến trình con giành thêm quyền root.",
            "choices": [
                ("Cấu hình privileged: true cho container", False),
                ("Thiết lập security_opt với no-new-privileges:true", True),
                ("Mở tất cả các cổng từ 1 đến 65535", False),
                ("Chia sẻ socket /var/run/docker.sock vào trong container", False)
            ]
        },
        {
            "id": 1206,
            "text": "Cú pháp ngôn ngữ truy vấn LogQL nào trong Grafana Loki dùng để lọc các dòng log có chứa chuỗi 'ERROR'?",
            "exp": "Trong LogQL, cú pháp {job=\"app\"} |= \"ERROR\" dùng để tìm kiếm các dòng log chứa chuỗi ký tự ERROR theo nhãn stream chỉ định.",
            "choices": [
                ("SELECT * FROM logs WHERE text LIKE '%ERROR%'", False),
                ("FILTER logs BY string 'ERROR'", False),
                ('{job="app"} |= "ERROR"', True),
                ('SEARCH "ERROR" IN ALL', False)
            ]
        },
        {
            "id": 1207,
            "text": "Trong Nginx, chỉ thị nào giúp che giấu số hiệu phiên bản Nginx trong response headers nhằm hạn chế lộ thông tin?",
            "exp": "server_tokens off; trong khối http hoặc server của nginx.conf sẽ ẩn phiên bản cụ thể của Nginx khỏi Server header và trang lỗi.",
            "choices": [
                ("hide_nginx_version on;", False),
                ("server_tokens off;", True),
                ("security_headers strict;", False),
                ("proxy_hide_details all;", False)
            ]
        },
        {
            "id": 1208,
            "text": "Tại sao việc mount Docker Socket (/var/run/docker.sock) vào ứng dụng public bị coi là lỗ hổng bảo mật nghiêm trọng?",
            "exp": "Docker Socket cung cấp quyền kiểm soát hoàn toàn Docker Daemon, nếu ứng dụng bị chiếm quyền, kẻ tấn công có thể tạo container mới với quyền root của máy host.",
            "choices": [
                ("Làm tăng dung lượng file log lên gấp đôi", False),
                ("Cho phép kẻ tấn công kiểm soát Docker Daemon và chiếm quyền root host", True),
                ("Gây xung đột địa chỉ IP giữa các container", False),
                ("Làm chậm tốc độ truy vấn cơ sở dữ liệu MySQL", False)
            ]
        },
        {
            "id": 1209,
            "text": "Loại metric nào trong Prometheus đại diện cho một giá trị số thực chỉ tăng hoặc reset về 0 (như tổng số request HTTP)?",
            "exp": "Counter là kiểu metric đơn điệu chỉ tăng (monotonically increasing counter), đại diện cho số lượng tích lũy như số request đã phục vụ.",
            "choices": [
                ("Gauge", False),
                ("Histogram", False),
                ("Summary", False),
                ("Counter", True)
            ]
        },
        {
            "id": 1210,
            "text": "Quy tắc Rate Limiting limit_req trong Nginx sử dụng thuật toán nào để kiểm soát lưu lượng request gửi đến server?",
            "exp": "Nginx sử dụng thuật toán Leaky Bucket (thùng rò rỉ) thông qua cấu hình limit_req_zone để xử lý request với tốc độ ổn định.",
            "choices": [
                ("Round Robin", False),
                ("Leaky Bucket (Thùng rò rỉ)", True),
                ("Token Bucket không giới hạn", False),
                ("Random Exponential Backoff", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 21: Tổng quan Bảo mật Web (Category 2)
    # -------------------------------------------------------------
    21: [
        {
            "id": 2101,
            "text": "Ba mục tiêu cốt lõi của an toàn thông tin trong mô hình bảo mật kinh điển CIA bao gồm những yếu tố nào?",
            "exp": "Mô hình CIA bao gồm Tính Bảo mật (Confidentiality), Tính Toàn vẹn (Integrity) và Tính Sẵn sàng (Availability).",
            "choices": [
                ("Confidentiality (Bảo mật), Integrity (Toàn vẹn), Availability (Sẵn sàng)", True),
                ("Control (Kiểm soát), Identity (Danh tính), Access (Truy cập)", False),
                ("Cyber (Không gian mạng), Infrastructure (Hạ tầng), Application (Ứng dụng)", False),
                ("Certificate (Chứng chỉ), Inspection (Kiểm tra), Authorization (Ủy quyền)", False)
            ]
        },
        {
            "id": 2102,
            "text": "Nguyên tắc 'Least Privilege' (Đặc quyền tối thiểu) trong bảo mật hệ thống phần mềm có nghĩa là gì?",
            "exp": "Chỉ cấp phát đúng các quyền hạn tối thiểu và cần thiết nhất cho người dùng hoặc tiến trình để hoàn thành nhiệm vụ.",
            "choices": [
                ("Cấp toàn quyền root cho lập trình viên để tiện gỡ lỗi", False),
                ("Chỉ cấp đúng các quyền tối thiểu cần thiết để hoàn thành công việc", True),
                ("Không bao giờ cấp quyền chỉnh sửa cho bất kỳ tài khoản nào", False),
                ("Chỉ giới hạn số lượng tài khoản đăng ký tối đa 10 người", False)
            ]
        },
        {
            "id": 2103,
            "text": "Tổ chức OWASP (Open Worldwide Application Security Project) định kỳ công bố danh sách nào nổi tiếng nhất trong bảo mật web?",
            "exp": "OWASP Top 10 là danh sách 10 rủi ro và lỗ hổng bảo mật ứng dụng web phổ biến và nguy hiểm nhất thế giới.",
            "choices": [
                ("OWASP Top 100 Port Scanner", False),
                ("OWASP Top 10 Web Application Security Risks", True),
                ("OWASP Linux Hardening Standards", False),
                ("OWASP Network Firewall Protocols", False)
            ]
        },
        {
            "id": 2104,
            "text": "Sự khác biệt cơ bản giữa mã hóa đối xứng (Symmetric) và mã hóa bất đối xứng (Asymmetric) là gì?",
            "exp": "Mã hóa đối xứng dùng cùng 1 khóa chung để mã hóa và giải mã (như AES), còn bất đối xứng dùng cặp khóa công khai và bí mật (như RSA, ECC).",
            "choices": [
                ("Mã hóa đối xứng dùng 2 khóa khác nhau, bất đối xứng dùng 1 khóa", False),
                ("Mã hóa đối xứng dùng 1 khóa chung, bất đối xứng dùng cặp khóa Public/Private", True),
                ("Mã hóa đối xứng chỉ dùng cho dữ liệu văn bản, bất đối xứng cho hình ảnh", False),
                ("Mã hóa đối xứng không thể bị giải mã trong bất kỳ tình huống nào", False)
            ]
        },
        {
            "id": 2105,
            "text": "Mã băm mật khẩu một chiều (One-way Hash Function) khác biệt với thuật toán mã hóa (Encryption) ở đặc điểm nào?",
            "exp": "Hàm băm là phép biến đổi toán học một chiều không thể giải mã ngược lại bản rõ gốc, trong khi dữ liệu mã hóa có thể giải mã khi có khóa.",
            "choices": [
                ("Dữ liệu băm luôn có thể giải mã ngược lại nếu biết mật khẩu root", False),
                ("Hàm băm là phép biến đổi một chiều, không thể giải mã ngược về bản gốc", True),
                ("Hàm băm làm cho chuỗi ký tự dài hơn gấp 10 lần", False),
                ("Hàm băm chỉ chạy được trên các dòng máy chủ chuyên dụng", False)
            ]
        },
        {
            "id": 2106,
            "text": "Trong kiến trúc web an toàn, khái niệm 'Defense in Depth' (Phòng thủ theo chiều sâu) được hiểu như thế nào?",
            "exp": "Áp dụng nhiều tầng lớp bảo vệ khác nhau (Firewall, Reverse Proxy, WAF, Input Validation, Mã hóa DB, Logging) để nếu một tầng bị xuyên thủng thì hệ thống vẫn an toàn.",
            "choices": [
                ("Chỉ tập trung bảo vệ duy nhất tầng cơ sở dữ liệu backend", False),
                ("Đặt toàn bộ server sâu trong phòng kín có điều hòa", False),
                ("Xây dựng nhiều lớp phòng thủ độc lập ở tất cả các tầng kiến trúc", True),
                ("Không cho phép người dùng truy cập web từ mạng ngoài", False)
            ]
        },
        {
            "id": 2107,
            "text": "Header bảo mật 'Strict-Transport-Security' (HSTS) bảo vệ người dùng web khỏi loại hình tấn công nào?",
            "exp": "HSTS ép buộc trình duyệt chỉ liên lạc với server qua giao thức HTTPS bảo mật, ngăn chặn các cuộc tấn công SSL Stripping và hạ cấp giao thức xuống HTTP.",
            "choices": [
                ("Tấn công hạ cấp giao thức (SSL Stripping / Downgrade Attack)", True),
                ("Tấn công từ chối dịch vụ phân tán DDoS tầng 3", False),
                ("Tấn công chèn mã độc JavaScript XSS", False),
                ("Tấn công brute force mật khẩu người dùng", False)
            ]
        },
        {
            "id": 2108,
            "text": "Lỗ hổng 'Broken Access Control' (Lỗi kiểm soát truy cập) đứng đầu OWASP Top 10 thường dẫn đến hậu quả gì?",
            "exp": "Người dùng trái phép có thể xem, chỉnh sửa hoặc xóa dữ liệu của người dùng khác hoặc thực hiện các tác vụ đặc quyền quản trị viên mà họ không được phép.",
            "choices": [
                ("Làm sập hệ điều hành của máy chủ", False),
                ("Người dùng bình thường truy cập và thao tác trái phép dữ liệu của người khác hoặc quyền Admin", True),
                ("Làm giảm tốc độ mạng Internet của máy khách", False),
                ("Gây cháy nổ bộ nguồn của phần cứng máy chủ", False)
            ]
        },
        {
            "id": 2109,
            "text": "Tại sao không nên tự xây dựng (tự chế) thuật toán mã hóa hoặc băm riêng cho ứng dụng production?",
            "exp": "Các thuật toán chuẩn (AES, RSA, SHA-256, Bcrypt) đã qua thẩm định và kiểm chứng toán học nghiêm ngặt bởi cộng đồng mật mã thế giới, thuật toán tự viết dễ chứa lỗ hổng chết người.",
            "choices": [
                ("Vì luật pháp quốc tế cấm người dùng viết mã nguồn toán học", False),
                ("Vì các thuật toán chuẩn đã được cộng đồng chuyên gia mật mã kiểm chứng bảo mật chặt chẽ", True),
                ("Vì mã tự viết chạy tốn nhiều dung lượng RAM hơn 100 lần", False),
                ("Vì Node.js không hỗ trợ chạy các thuật toán tự định nghĩa", False)
            ]
        },
        {
            "id": 2110,
            "text": "Nguyên tắc 'Fail-Safe Defaults' trong thiết kế phân quyền hệ thống quy định điều gì?",
            "exp": "Mặc định từ chối toàn bộ truy cập (Deny by default), chỉ cho phép truy cập khi có quy tắc xác nhận quyền rõ ràng.",
            "choices": [
                ("Mặc định cấp quyền truy cập công khai nếu xảy ra lỗi hệ thống", False),
                ("Mặc định từ chối mọi quyền truy cập trừ khi được cấp phép rõ ràng", True),
                ("Khi có lỗi crash thì khởi động lại toàn bộ máy chủ vật lý", False),
                ("Lưu trữ mật khẩu dưới dạng văn bản thô để tiện khôi phục", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 22: Xác thực, Phân quyền & Bảo vệ Dữ liệu (Category 2)
    # -------------------------------------------------------------
    22: [
        {
            "id": 2201,
            "text": "Một chuỗi JSON Web Token (JWT) tiêu chuẩn gồm có bao nhiêu phần và ngăn cách nhau bởi ký tự nào?",
            "exp": "JWT gồm 3 phần: Header, Payload, Signature, được mã hóa Base64Url và ngăn cách bởi dấu chấm (.).",
            "choices": [
                ("2 phần ngăn cách bởi dấu gạch ngang (-)", False),
                ("3 phần (Header, Payload, Signature) ngăn cách bởi dấu chấm (.)", True),
                ("4 phần ngăn cách bởi dấu hai chấm (:)", False),
                ("1 chuỗi hex nhị phân duy nhất không có dấu phân cách", False)
            ]
        },
        {
            "id": 2202,
            "text": "Tại sao KHÔNG ĐƯỢC LƯU mật khẩu hoặc thông tin thẻ ngân hàng trong Payload của chuỗi JWT ký thông thường?",
            "exp": "Payload của JWT chỉ được encode bằng Base64Url chứ không hề được mã hóa bí mật, bất kỳ ai có token đều có thể decode và đọc được nội dung bên trong.",
            "choices": [
                ("Vì JWT không chấp nhận ký tự số và chữ hoa", False),
                ("Vì Payload của JWT chỉ encode Base64Url chứ không mã hóa bí mật, ai cũng đọc được", True),
                ("Vì cơ sở dữ liệu MySQL sẽ từ chối lưu token", False),
                ("Vì kích thước của JWT sẽ vượt quá giới hạn 100 byte", False)
            ]
        },
        {
            "id": 2203,
            "text": "Kỹ thuật 'Token Revocation' (Thu hồi JWT) khi người dùng bấm đăng xuất có thể được hiện thực hiệu quả bằng cách nào?",
            "exp": "Dùng cơ chế token_version / jwt_id lưu trong database hoặc Redis Blacklist; khi user logout thì tăng version để các token cũ bị từ chối 401.",
            "choices": [
                ("Chỉ cần gửi thông báo JavaScript alert về cho người dùng", False),
                ("Xóa file server.js và khởi động lại container", False),
                ("Quản lý token_version trong cơ sở dữ liệu hoặc Redis Blacklist để từ chối token cũ", True),
                ("Đổi tên miền của trang web sang địa chỉ mới", False)
            ]
        },
        {
            "id": 2204,
            "text": "Mô hình phân quyền RBAC (Role-Based Access Control) hoạt động dựa trên nguyên lý cơ bản nào?",
            "exp": "Quyền hạn (Permissions) được gán cho các Vai trò (Roles), và Người dùng (Users) được gán vào các Vai trò tương ứng.",
            "choices": [
                ("Phân quyền trực tiếp theo từng địa chỉ IP của thiết bị", False),
                ("Gán quyền hạn cho các Vai trò (Roles), sau đó gán Người dùng vào các Vai trò đó", True),
                ("Mọi người dùng đăng nhập vào hệ thống đều có quyền như nhau", False),
                ("Phân quyền dựa vào thời gian người dùng online trên website", False)
            ]
        },
        {
            "id": 2205,
            "text": "Thuộc tính SameSite=Lax của cookie mang lại sự cân bằng bảo mật và trải nghiệm như thế nào?",
            "exp": "Chặn gửi cookie trong các cross-site POST request mạo danh (chống CSRF), nhưng vẫn gửi cookie khi người dùng click vào link điều hướng GET thông thường.",
            "choices": [
                ("Cho phép tất cả trang web bên ngoài đọc dữ liệu cookie", False),
                ("Chống CSRF trong các request POST mạo danh nhưng vẫn giữ phiên khi click link GET", True),
                ("Xóa cookie ngay sau khi người dùng đóng tab trình duyệt", False),
                ("Mã hóa toàn bộ nội dung cookie bằng thuật toán RSA 4096", False)
            ]
        },
        {
            "id": 2206,
            "text": "Thuật toán Bcrypt sử dụng yếu tố nào để tự động thích ứng với tốc độ phần cứng ngày càng tăng trong tương lai?",
            "exp": "Bcrypt có tham số Cost Factor (work factor / salt rounds), tăng độ trễ tính toán theo cấp số nhân để chống lại việc bẻ khóa bằng GPU/ASIC.",
            "choices": [
                ("Tự động tăng số ký tự ngẫu nhiên trong tên người dùng", False),
                ("Tham số Cost Factor (Work Factor) làm chậm thời gian tính toán băm", True),
                ("Yêu cầu kết nối mạng cáp quang tốc độ cao", False),
                ("Giới hạn số lượng tài khoản đăng nhập mỗi ngày", False)
            ]
        },
        {
            "id": 2207,
            "text": "Trong cơ chế Multi-Factor Authentication (MFA), phương thức TOTP (như Google Authenticator) hoạt động dựa trên yếu tố gì?",
            "exp": "TOTP sinh mã xác thực 6 chữ số dựa trên khóa bí mật chung (Shared Secret Key) và mốc thời gian Unix Epoch hiện tại (thường làm mới mỗi 30 giây).",
            "choices": [
                ("Khóa bí mật chia sẻ kết hợp với đồng hồ thời gian hiện tại (Time-based)", True),
                ("Số lượng tin nhắn SMS gửi đến tổng đài viễn thông", False),
                ("Độ dài của mật khẩu người dùng đã nhập", False),
                ("Vị trí GPS thời gian thực của máy tính người dùng", False)
            ]
        },
        {
            "id": 2208,
            "text": "Hình thức tấn công Credential Stuffing là gì và biện pháp phòng ngừa hiệu quả nhất là gì?",
            "exp": "Kẻ tấn công dùng danh sách username/password bị rò rỉ từ các dịch vụ khác để thử đăng nhập hàng loạt; phòng chống bằng MFA, CAPTCHA và Rate Limiting.",
            "choices": [
                ("Gửi email lừa đảo người dùng bấm vào link ngân hàng", False),
                ("Dùng dữ liệu tài khoản rò rỉ từ nơi khác thử đăng nhập hàng loạt; chống bằng MFA và Rate Limit", True),
                ("Chèn mã JavaScript vào phần bình luận của diễn đàn", False),
                ("Tấn công làm nghẽn băng thông đường truyền mạng", False)
            ]
        },
        {
            "id": 2209,
            "text": "Tại sao việc lưu trữ Refresh Token an toàn đòi hỏi phải cấp phát xoay vòng (Refresh Token Rotation)?",
            "exp": "Khi Refresh Token được dùng để lấy Access Token mới, hệ thống thu hồi token cũ và phát hành Refresh Token mới; nếu token cũ bị tái sử dụng thì hủy toàn bộ phiên của user.",
            "choices": [
                ("Để tránh bị tràn bộ nhớ RAM của máy chủ backend", False),
                ("Phát hiện việc đánh cắp token và vô hiệu hóa ngay lập tức toàn bộ phiên làm việc của kẻ gian", True),
                ("Giúp người dùng không cần phải kết nối Internet vẫn đăng nhập được", False),
                ("Tăng tốc độ truy vấn cơ sở dữ liệu MySQL lên gấp 2 lần", False)
            ]
        },
        {
            "id": 2210,
            "text": "Quy chuẩn mã hóa dữ liệu 'Data at Rest' thường áp dụng cho loại đối tượng nào trong hệ thống?",
            "exp": "Data at Rest là dữ liệu đang được lưu trữ tĩnh trong cơ sở dữ liệu, file ổ đĩa, bản sao lưu backup và volume lưu trữ.",
            "choices": [
                ("Dữ liệu đang truyền qua cáp mạng Internet", False),
                ("Dữ liệu đang được lưu trữ tĩnh trong database, file hệ thống và ổ đĩa backup", True),
                ("Dữ liệu tạm thời lưu trong thanh ghi vi xử lý CPU", False),
                ("Các gói tin HTTP header đang được Nginx proxy", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 31: Địa chỉ IP, TCP/UDP & DNS (Category 3)
    # -------------------------------------------------------------
    31: [
        {
            "id": 3101,
            "text": "Một địa chỉ IPv4 tiêu chuẩn có độ dài bao nhiêu bit và được chia thành bao nhiêu octet?",
            "exp": "IPv4 có độ dài 32 bit, được chia thành 4 octet (mỗi octet gồm 8 bit) viết dưới dạng số thập phân có dấu chấm (dotted decimal).",
            "choices": [
                ("32 bit, chia thành 4 octet", True),
                ("64 bit, chia thành 8 octet", False),
                ("128 bit, chia thành 16 octet", False),
                ("16 bit, chia thành 2 octet", False)
            ]
        },
        {
            "id": 3102,
            "text": "Quá trình bắt tay 3 bước (Three-way Handshake) để thiết lập kết nối TCP bao gồm chuỗi cờ (flags) nào?",
            "exp": "Bắt tay 3 bước TCP diễn ra theo trình tự: Client gửi SYN -> Server phản hồi SYN-ACK -> Client gửi lại ACK.",
            "choices": [
                ("ACK -> SYN -> FIN", False),
                ("SYN -> SYN-ACK -> ACK", True),
                ("HELLO -> ACK -> CONNECT", False),
                ("RST -> PSH -> URG", False)
            ]
        },
        {
            "id": 3103,
            "text": "Điểm khác biệt cơ bản nhất giữa hai giao thức tầng Giao vận TCP và UDP là gì?",
            "exp": "TCP là giao thức hướng kết nối, đảm bảo tin cậy và thứ tự gói tin; còn UDP là giao thức không kết nối, truyền tải nhanh nhưng không đảm bảo nhận đủ gói tin.",
            "choices": [
                ("TCP chỉ truyền được văn bản, UDP truyền được âm thanh", False),
                ("TCP hướng kết nối và đảm bảo tin cậy, UDP không kết nối và tối ưu tốc độ", True),
                ("UDP có kích thước header lớn hơn TCP gấp 4 lần", False),
                ("TCP hoạt động ở tầng Network, UDP hoạt động ở tầng Transport", False)
            ]
        },
        {
            "id": 3104,
            "text": "Bản ghi DNS loại nào (DNS Record Type) được sử dụng để ánh xạ một tên miền sang một địa chỉ IPv4?",
            "exp": "Bản ghi A (Address Record) ánh xạ tên miền tới địa chỉ IPv4; còn AAAA dùng cho IPv6.",
            "choices": [
                ("Bản ghi CNAME", False),
                ("Bản ghi MX", False),
                ("Bản ghi A", True),
                ("Bản ghi TXT", False)
            ]
        },
        {
            "id": 3105,
            "text": "Ký hiệu Subnet Mask /24 theo chuẩn CIDR tương ứng với dải địa chỉ mạng có bao nhiêu host khả dụng?",
            "exp": "Subnet /24 có 32 - 24 = 8 bit cho host, tổng 2^8 = 256 địa chỉ; trừ địa chỉ Network và Broadcast thì còn lại 254 host khả dụng.",
            "choices": [
                ("256 host", False),
                ("254 host", True),
                ("128 host", False),
                ("512 host", False)
            ]
        },
        {
            "id": 3106,
            "text": "Địa chỉ IP nào sau đây thuộc dải địa chỉ Loopback (Localhost) của chuẩn mạng IPv4?",
            "exp": "Dải 127.0.0.0/8 là dải loopback của IPv4, trong đó 127.0.0.1 đại diện cho chính máy cục bộ (localhost).",
            "choices": [
                ("192.168.1.1", False),
                ("10.0.0.1", False),
                ("127.0.0.1", True),
                ("172.16.0.1", False)
            ]
        },
        {
            "id": 3107,
            "text": "Giao thức nào được sử dụng để phân giải địa chỉ logic (IP) thành địa chỉ vật lý (MAC) trong mạng cục bộ LAN?",
            "exp": "ARP (Address Resolution Protocol) phân giải địa chỉ mạng IP thành địa chỉ phần cứng MAC trong mạng LAN Ethernet.",
            "choices": [
                ("DHCP", False),
                ("ARP (Address Resolution Protocol)", True),
                ("ICMP", False),
                ("RARP", False)
            ]
        },
        {
            "id": 3108,
            "text": "Bản ghi CNAME (Canonical Name) trong hệ thống DNS có tác dụng chính là gì?",
            "exp": "CNAME tạo bí danh (alias) trỏ một tên miền này tới một tên miền chuẩn tắc khác (canonical domain name).",
            "choices": [
                ("Chỉ định máy chủ tiếp nhận thư điện tử Email", False),
                ("Tạo bí danh (alias) trỏ một tên miền tới một tên miền khác", True),
                ("Lưu trữ khóa công khai để xác thực chứng chỉ số", False),
                ("Giới hạn số lượng truy cập vào website trong 1 giây", False)
            ]
        },
        {
            "id": 3109,
            "text": "Hiện tượng 'Head-of-Line Blocking' (HOL Blocking) trong TCP ảnh hưởng như thế nào đến truyền thông mạng?",
            "exp": "Nếu một gói tin bị mất trên đường truyền, tất cả các gói tin đến sau phải chờ gói tin đó được gửi lại thành công mới được xử lý tiếp, làm giảm hiệu năng.",
            "choices": [
                ("Làm cho máy chủ bị tắt nguồn đột ngột", False),
                ("Khi một gói tin bị mất, tất cả các gói tin sau phải đợi, làm chậm toàn bộ luồng truyền tải", True),
                ("Tự động tăng gấp đôi băng thông đường truyền cáp quang", False),
                ("Làm đảo lộn trật tự các byte dữ liệu trong RAM", False)
            ]
        },
        {
            "id": 3110,
            "text": "Số lượng cổng logic (Ports) tối đa cho mỗi giao thức TCP hoặc UDP trên một giao diện mạng là bao nhiêu?",
            "exp": "Trường Port number có độ dài 16 bit, do đó dải cổng từ 0 đến 65535 (tổng cộng 65.536 cổng).",
            "choices": [
                ("1024 cổng", False),
                ("32768 cổng", False),
                ("65535 cổng", True),
                ("Không giới hạn số lượng cổng", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 32: HTTP/HTTPS, TLS & Reverse Proxy (Category 3)
    # -------------------------------------------------------------
    32: [
        {
            "id": 3201,
            "text": "Mã trạng thái HTTP nào biểu thị một chuyển hướng vĩnh viễn (Permanent Redirect) của tài nguyên?",
            "exp": "301 Moved Permanently chỉ định tài nguyên đã được chuyển vĩnh viễn sang URI mới và trình duyệt nên lưu cache chuyển hướng này.",
            "choices": [
                ("302 Found", False),
                ("301 Moved Permanently", True),
                ("304 Not Modified", False),
                ("307 Temporary Redirect", False)
            ]
        },
        {
            "id": 3202,
            "text": "Sự khác biệt căn bản giữa Forward Proxy và Reverse Proxy là gì?",
            "exp": "Forward Proxy đại diện cho máy khách (client) truy cập ra ngoài Internet; Reverse Proxy đại diện cho máy chủ (server) tiếp nhận request và định tuyến vào các backend nội bộ.",
            "choices": [
                ("Forward Proxy đứng trước server, Reverse Proxy đứng sau client", False),
                ("Forward Proxy đại diện cho Client, Reverse Proxy đại diện cho Server", True),
                ("Forward Proxy chỉ chạy được với giao thức UDP, Reverse Proxy chạy TCP", False),
                ("Cả hai loại proxy hoàn toàn giống nhau, chỉ khác tên phần mềm", False)
            ]
        },
        {
            "id": 3203,
            "text": "Trong kiến trúc Nginx Reverse Proxy, chỉ thị 'proxy_pass' có vai trò chức năng gì?",
            "exp": "Chỉ thị proxy_pass chuyển tiếp (forward) request từ client đến cụm máy chủ ứng dụng backend upstream được chỉ định.",
            "choices": [
                ("Đặt mật khẩu bảo vệ thư mục mã nguồn Nginx", False),
                ("Chuyển tiếp request của client tới máy chủ backend nội bộ (upstream)", True),
                ("Tự động tạo chứng chỉ SSL/TLS miễn phí", False),
                ("Chặn toàn bộ các request có nguồn gốc từ nước ngoài", False)
            ]
        },
        {
            "id": 3204,
            "text": "Tính năng Server Name Indication (SNI) trong TLS cho phép máy chủ làm được điều gì?",
            "exp": "SNI cho phép máy chủ lưu trữ nhiều chứng chỉ SSL/TLS khác nhau cho nhiều tên miền trên cùng một địa chỉ IP duy nhất bằng cách gửi hostname trong client hello.",
            "choices": [
                ("Tăng tốc độ nén dữ liệu HTTP gzip", False),
                ("Phục vụ nhiều chứng chỉ SSL/TLS cho nhiều tên miền khác nhau trên cùng một địa chỉ IP", True),
                ("Tự động quét virus trên máy tính người dùng", False),
                ("Tắt mã hóa TLS để truyền tin nhanh hơn", False)
            ]
        },
        {
            "id": 3205,
            "text": "HTTP/2 mang lại cải tiến vượt bậc nào về mặt truyền tải so với giao thức HTTP/1.1 cổ điển?",
            "exp": "HTTP/2 hỗ trợ Multiplexing (ghép kênh nhiều request/response trên cùng 1 kết nối TCP duy nhất), nén header với HPACK và Server Push.",
            "choices": [
                ("Loại bỏ hoàn toàn mã hóa HTTPS để giảm tải CPU", False),
                ("Ghép kênh (Multiplexing) nhiều luồng truyền trên 1 kết nối TCP duy nhất và nén Header", True),
                ("Thay đổi cổng mặc định từ 80 sang 8080", False),
                ("Bắt buộc người dùng phải cài đặt phần mềm chuyên dụng để duyệt web", False)
            ]
        },
        {
            "id": 3206,
            "text": "Khái niệm 'SSL Termination' (Chấm dứt SSL) tại tầng Nginx Reverse Proxy có ý nghĩa gì?",
            "exp": "Nginx giải mã HTTPS từ client bên ngoài, sau đó forward request bằng HTTP nội bộ tới backend trong mạng an toàn, giúp giảm tải mã hóa cho app.",
            "choices": [
                ("Hủy bỏ chứng chỉ SSL vì phát hiện chứng chỉ hết hạn", False),
                ("Giải mã HTTPS tại Nginx và giao tiếp HTTP nội bộ với backend để giảm tải cho app", True),
                ("Cấm người dùng truy cập web bằng kết nối mã hóa", False),
                ("Xóa toàn bộ file chứng chỉ private key trên ổ đĩa máy chủ", False)
            ]
        },
        {
            "id": 3207,
            "text": "Header HTTP nào thường được Nginx thêm vào để thông báo cho backend biết địa chỉ IP thật của người dùng?",
            "exp": "Nginx dùng proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; hoặc X-Real-IP để backend nhận diện đúng IP client ban đầu.",
            "choices": [
                ("X-Server-Name", False),
                ("X-Forwarded-For và X-Real-IP", True),
                ("X-Origin-Host", False),
                ("X-Nginx-Client-Token", False)
            ]
        },
        {
            "id": 3208,
            "text": "Thuật toán cân bằng tải (Load Balancing) 'Least Connections' trong Nginx ưu tiên phân phối request cho máy chủ nào?",
            "exp": "Least Connections chuyển request tiếp theo cho máy chủ backend hiện đang có số lượng kết nối hoạt động (active connections) ít nhất.",
            "choices": [
                ("Máy chủ có địa chỉ IP nhỏ nhất", False),
                ("Máy chủ backend đang có số lượng kết nối hoạt động ít nhất", True),
                ("Máy chủ vừa mới được khởi động lại trong 5 phút", False),
                ("Phân phối ngẫu nhiên theo xác suất 50/50", False)
            ]
        },
        {
            "id": 3209,
            "text": "Mã trạng thái HTTP 504 Gateway Timeout xuất hiện khi nào trong hệ thống Reverse Proxy?",
            "exp": "Xảy ra khi Nginx làm vai trò proxy nhưng không nhận được phản hồi từ máy chủ upstream backend trong khoảng thời gian chờ quy định (proxy_read_timeout).",
            "choices": [
                ("Trang web không có chứng chỉ bảo mật SSL", False),
                ("Proxy không nhận được phản hồi từ backend upstream trong thời gian quy định", True),
                ("Người dùng nhập sai mật khẩu đăng nhập quá 5 lần", False),
                ("Tên miền của website đã bị nhà đăng ký thu hồi", False)
            ]
        },
        {
            "id": 3210,
            "text": "Giao thức HTTP/3 sử dụng giao thức tầng Giao vận nào làm nền tảng thay thế cho TCP?",
            "exp": "HTTP/3 sử dụng giao thức QUIC chạy trên nền UDP, giải quyết triệt để vấn đề Head-of-Line blocking và tăng tốc độ kết nối lại.",
            "choices": [
                ("SCTP", False),
                ("ICMP", False),
                ("QUIC (chạy trên nền UDP)", True),
                ("IPsec", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 41: Cơ sở Dữ liệu Quan hệ & SQL (Category 4)
    # -------------------------------------------------------------
    41: [
        {
            "id": 4101,
            "text": "Trong cơ sở dữ liệu quan hệ, 'Khóa chính' (Primary Key) phải thỏa mãn những điều kiện bắt buộc nào?",
            "exp": "Khóa chính phải chứa giá trị duy nhất (UNIQUE) cho mỗi bản ghi và tuyệt đối không được chứa giá trị rỗng (NOT NULL).",
            "choices": [
                ("Giá trị duy nhất (Unique) và không được phép chứa giá trị NULL", True),
                ("Chỉ chấp nhận số nguyên tăng dần và cho phép chứa NULL", False),
                ("Có thể trùng lặp nếu các cột khác có giá trị khác nhau", False),
                ("Bắt buộc phải là kiểu dữ liệu chuỗi ký tự VARCHAR", False)
            ]
        },
        {
            "id": 4102,
            "text": "Ràng buộc 'Khóa ngoại' (Foreign Key) trong mô hình RDBMS giữ nhiệm vụ cốt lõi gì?",
            "exp": "Bảo đảm tính toàn vẹn tham chiếu (Referential Integrity) giữa hai bảng, ngăn chặn dữ liệu 'mồ côi' trỏ tới bản ghi không tồn tại.",
            "choices": [
                ("Tăng tốc độ hiển thị hình ảnh trên website", False),
                ("Bảo đảm tính toàn vẹn tham chiếu dữ liệu giữa hai bảng", True),
                ("Mã hóa mật khẩu người dùng trước khi lưu", False),
                ("Tự động sao lưu dữ liệu sang máy chủ phụ", False)
            ]
        },
        {
            "id": 4103,
            "text": "Nhóm câu lệnh DDL (Data Definition Language) trong SQL bao gồm những lệnh nào sau đây?",
            "exp": "DDL định nghĩa cấu trúc dữ liệu, bao gồm CREATE, ALTER, DROP, TRUNCATE; còn DML gồm SELECT, INSERT, UPDATE, DELETE.",
            "choices": [
                ("INSERT, UPDATE, DELETE, SELECT", False),
                ("CREATE, ALTER, DROP, TRUNCATE", True),
                ("GRANT, REVOKE, DENY", False),
                ("COMMIT, ROLLBACK, SAVEPOINT", False)
            ]
        },
        {
            "id": 4104,
            "text": "Sự khác biệt căn bản giữa hai câu lệnh DELETE và TRUNCATE trong MySQL là gì?",
            "exp": "DELETE là DML xóa từng dòng (có thể lọc WHERE, sinh log rollback); TRUNCATE là DDL xóa toàn bộ bảng và tạo lại, reset auto-increment và nhanh hơn nhiều.",
            "choices": [
                ("DELETE xóa vĩnh viễn không thể rollback, TRUNCATE thì rollback được", False),
                ("DELETE xóa theo từng dòng có điều kiện WHERE, TRUNCATE xóa toàn bộ bảng và reset auto-increment", True),
                ("TRUNCATE chỉ chạy được khi server tắt kết nối mạng", False),
                ("Cả hai câu lệnh hoàn toàn giống hệt nhau về tốc độ và bản chất", False)
            ]
        },
        {
            "id": 4105,
            "text": "Tùy chọn 'ON DELETE CASCADE' trong định nghĩa khóa ngoại mang lại hành vi nào?",
            "exp": "Khi một bản ghi ở bảng cha bị xóa, toàn bộ các bản ghi liên quan tham chiếu ở bảng con cũng sẽ tự động bị xóa theo.",
            "choices": [
                ("Báo lỗi và từ chối xóa bản ghi ở bảng cha", False),
                ("Tự động xóa tất cả bản ghi con liên quan khi bản ghi cha bị xóa", True),
                ("Gán giá trị NULL cho tất cả bản ghi con", False),
                ("Tự động sao chép bản ghi bị xóa sang bảng lưu trữ tạm", False)
            ]
        },
        {
            "id": 4106,
            "text": "Kiểu dữ liệu nào sau đây trong MySQL hỗ trợ lưu trữ toàn bộ các ký tự Unicode bao gồm cả biểu tượng Emoji (4 byte)?",
            "exp": "utf8mb4 hỗ trợ 4 byte cho mỗi ký tự, đầy đủ chuẩn Unicode bao gồm cả emoji; trong khi utf8mb3 cũ chỉ hỗ trợ tối đa 3 byte.",
            "choices": [
                ("latin1", False),
                ("utf8mb3", False),
                ("utf8mb4", True),
                ("ascii_bin", False)
            ]
        },
        {
            "id": 4107,
            "text": "Mục đích của việc Chuẩn hóa dữ liệu (Database Normalization - 1NF, 2NF, 3NF) là gì?",
            "exp": "Giảm thiểu sự dư thừa dữ liệu (data redundancy), tránh các dị thường (anomalies) khi thêm, sửa, xóa và đảm bảo tính toàn vẹn.",
            "choices": [
                ("Tăng kích thước dung lượng file database lên mức tối đa", False),
                ("Giảm thiểu dư thừa dữ liệu và loại bỏ các bất thường khi thao tác dữ liệu", True),
                ("Giúp hệ thống chạy được mà không cần cài đặt MySQL", False),
                ("Tự động viết code backend thay cho lập trình viên", False)
            ]
        },
        {
            "id": 4108,
            "text": "Từ khóa DISTINCT trong câu lệnh SELECT dùng để làm gì?",
            "exp": "Loại bỏ các dòng kết quả trùng lặp, chỉ giữ lại các giá trị phân biệt duy nhất trong tập kết quả trả về.",
            "choices": [
                ("Sắp xếp kết quả theo thứ tự từ điển", False),
                ("Loại bỏ các bản ghi trùng lặp trong tập kết quả trả về", True),
                ("Đếm tổng số bản ghi trong bảng", False),
                ("Giới hạn số lượng dòng hiển thị tối đa là 10", False)
            ]
        },
        {
            "id": 4109,
            "text": "Câu lệnh SQL nào sau đây dùng để cấp quyền truy cập SELECT và INSERT trên cơ sở dữ liệu cho user?",
            "exp": "GRANT SELECT, INSERT ON db_name.* TO 'user'@'host'; là cú pháp DCL cấp quyền tiêu chuẩn trong MySQL.",
            "choices": [
                ("ALLOW USER TO SELECT, INSERT", False),
                ("GRANT SELECT, INSERT ON db_name.* TO 'user'@'host';", True),
                ("PERMIT 'user' ON DATABASE db_name", False),
                ("SET PRIVILEGE SELECT, INSERT TO 'user'", False)
            ]
        },
        {
            "id": 4110,
            "text": "Tại sao nên dùng InnoDB thay vì MyISAM làm Storage Engine mặc định cho MySQL hiện đại?",
            "exp": "InnoDB hỗ trợ đầy đủ giao dịch ACID, khóa theo mức dòng (Row-level locking) và khóa ngoại (Foreign Keys), vượt trội so với MyISAM chỉ khóa mức bảng.",
            "choices": [
                ("InnoDB hỗ trợ giao dịch ACID, khóa mức dòng (Row-level lock) và khóa ngoại", True),
                ("MyISAM an toàn hơn khi mất điện đột ngột", False),
                ("InnoDB không chiếm dung lượng ổ đĩa cứng", False),
                ("MyISAM hỗ trợ nhiều ngôn ngữ lập trình hơn InnoDB", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 42: Truy vấn JOIN, GROUP BY & Truy vấn Con (Category 4)
    # -------------------------------------------------------------
    42: [
        {
            "id": 4201,
            "text": "Phép INNER JOIN giữa hai bảng Bảng A và Bảng B sẽ trả về tập kết quả như thế nào?",
            "exp": "INNER JOIN chỉ trả về những dòng có giá trị khớp nhau ở điều kiện kết nối giữa cả hai bảng A và B.",
            "choices": [
                ("Chỉ trả về các dòng thỏa mãn điều kiện kết nối ở cả hai bảng", True),
                ("Trả về tất cả các dòng của bảng A bất kể bảng B có khớp hay không", False),
                ("Trả về tất cả các dòng của cả hai bảng và điền NULL vào chỗ thiếu", False),
                ("Tạo tích Đề-các (Cartesian product) của tất cả các dòng", False)
            ]
        },
        {
            "id": 4202,
            "text": "Phép LEFT JOIN giữa Bảng A (bên trái) và Bảng B (bên phải) sẽ xử lý thế nào khi một dòng ở A không có dòng tương ứng ở B?",
            "exp": "LEFT JOIN giữ lại toàn bộ các dòng của bảng A bên trái; các cột thuộc bảng B bên phải không khớp sẽ nhận giá trị NULL.",
            "choices": [
                ("Loại bỏ dòng đó khỏi tập kết quả", False),
                ("Giữ lại dòng của bảng A và điền giá trị NULL cho các cột của bảng B", True),
                ("Báo lỗi cú pháp SQL và dừng thực thi truy vấn", False),
                ("Tự động gán giá trị 0 cho tất cả các cột", False)
            ]
        },
        {
            "id": 4203,
            "text": "Sự khác biệt căn bản giữa mệnh đề WHERE và mệnh đề HAVING trong câu lệnh SQL có GROUP BY là gì?",
            "exp": "WHERE lọc các dòng dữ liệu riêng lẻ trước khi thực hiện gom nhóm; HAVING lọc các nhóm dữ liệu sau khi đã thực thi hàm tổng hợp (SUM, COUNT, AVG...).",
            "choices": [
                ("WHERE lọc sau khi gom nhóm, HAVING lọc trước khi gom nhóm", False),
                ("WHERE lọc từng dòng trước khi gom nhóm, HAVING lọc kết quả nhóm sau tính hàm tổng hợp", True),
                ("WHERE chỉ dùng cho số, HAVING chỉ dùng cho chuỗi ký tự", False),
                ("Cả hai mệnh đề hoàn toàn tương đương nhau và có thể thay thế tự do", False)
            ]
        },
        {
            "id": 4204,
            "text": "Hàm tổng hợp COUNT(*) khác biệt với COUNT(column_name) ở điểm mấu chốt nào?",
            "exp": "COUNT(*) đếm tất cả các dòng bao gồm cả dòng có giá trị NULL; còn COUNT(column_name) chỉ đếm các dòng có giá trị khác NULL ở cột đó.",
            "choices": [
                ("COUNT(*) đếm tất cả các dòng, COUNT(column_name) bỏ qua các giá trị NULL", True),
                ("COUNT(*) chạy chậm hơn 100 lần so với COUNT(column_name)", False),
                ("COUNT(column_name) đếm luôn cả các giá trị NULL", False),
                ("Cả hai hàm luôn luôn trả về cùng một kết quả như nhau trong mọi trường hợp", False)
            ]
        },
        {
            "id": 4205,
            "text": "Truy vấn con tương quan (Correlated Subquery) có đặc điểm vận hành nào cần lưu ý về hiệu năng?",
            "exp": "Correlated Subquery tham chiếu đến giá trị của truy vấn cha bên ngoài, do đó nó phải thực thi lặp lại cho từng dòng dữ liệu của truy vấn cha, dễ gây chậm.",
            "choices": [
                ("Chỉ thực thi đúng 1 lần duy nhất trước khi truy vấn cha bắt đầu", False),
                ("Phải thực thi lại cho từng dòng của truy vấn cha, dễ gây suy giảm hiệu năng", True),
                ("Không bao giờ được phép xuất hiện trong mệnh đề WHERE", False),
                ("Tự động biến câu truy vấn thành đa tiến trình chạy song song", False)
            ]
        },
        {
            "id": 4206,
            "text": "Toán tử EXISTS trong SQL trả về kết quả TRUE khi nào?",
            "exp": "EXISTS trả về TRUE ngay khi truy vấn con bên trong trả về ít nhất một dòng kết quả bất kỳ.",
            "choices": [
                ("Khi truy vấn con trả về giá trị NULL", False),
                ("Khi truy vấn con trả về ít nhất một bản ghi dữ liệu", True),
                ("Khi toàn bộ các dòng của bảng đều thỏa mãn điều kiện", False),
                ("Khi bảng con có nhiều hơn 100 bản ghi", False)
            ]
        },
        {
            "id": 4207,
            "text": "Phép toán UNION khác với UNION ALL ở điểm nào trong SQL?",
            "exp": "UNION tự động loại bỏ các dòng trùng lặp giữa các tập kết quả; UNION ALL giữ nguyên tất cả và chạy nhanh hơn vì không cần bước sắp xếp khử trùng lặp.",
            "choices": [
                ("UNION giữ lại bản ghi trùng lặp, UNION ALL loại bỏ bản ghi trùng lặp", False),
                ("UNION loại bỏ các bản ghi trùng lặp, UNION ALL giữ nguyên tất cả bản ghi", True),
                ("UNION chỉ dùng cho MySQL, UNION ALL chỉ dùng cho Oracle", False),
                ("UNION chỉ kết nối được tối đa 2 bảng", False)
            ]
        },
        {
            "id": 4208,
            "text": "Mệnh đề GROUP BY thường bắt buộc phải đi kèm với các thành phần nào trong câu lệnh SELECT?",
            "exp": "Mọi cột trong danh sách SELECT không nằm trong mệnh đề GROUP BY đều phải là đối số của các hàm tổng hợp (Aggregate functions như SUM, AVG, MAX, MIN, COUNT).",
            "choices": [
                ("Các hàm tổng hợp (Aggregate Functions như COUNT, SUM, AVG)", True),
                ("Mệnh đề LIMIT 1", False),
                ("Chỉ thị FORCE INDEX", False),
                ("Lệnh DROP TABLE", False)
            ]
        },
        {
            "id": 4209,
            "text": "Khi sử dụng CROSS JOIN giữa Bảng A có 10 dòng và Bảng B có 20 dòng, số dòng kết quả thu được là bao nhiêu?",
            "exp": "CROSS JOIN sinh tích Descartes (Cartesian Product), số dòng kết quả = 10 * 20 = 200 dòng.",
            "choices": [
                ("30 dòng", False),
                ("200 dòng", True),
                ("10 dòng", False),
                ("20 dòng", False)
            ]
        },
        {
            "id": 4210,
            "text": "Toán tử IN trong SQL có thể được thay thế tối ưu bằng kỹ thuật nào khi truy vấn dữ liệu lớn?",
            "exp": "Thay thế IN (subquery) bằng phép JOIN (INNER JOIN hoặc EXISTS) thường cho phép bộ tối ưu MySQL sử dụng index tốt hơn và giảm tải thời gian quét bảng.",
            "choices": [
                ("Thay bằng phép JOIN hoặc toán tử EXISTS", True),
                ("Thay bằng việc gọi lệnh SELECT nhiều lần bằng vòng lặp", False),
                ("Thay bằng câu lệnh ALTER TABLE", False),
                ("Tắt bộ nhớ cache của MySQL", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 43: Transaction, Index & Sao lưu (Category 4)
    # -------------------------------------------------------------
    43: [
        {
            "id": 4301,
            "text": "Bốn tính chất cốt lõi của một giao dịch (Transaction) trong chuẩn ACID bao gồm những gì?",
            "exp": "ACID bao gồm: Atomicity (Nguyên tử), Consistency (Nhất quán), Isolation (Cô lập) và Durability (Bền vững).",
            "choices": [
                ("Atomicity (Nguyên tử), Consistency (Nhất quán), Isolation (Cô lập), Durability (Bền vững)", True),
                ("Accuracy (Chính xác), Capacity (Dung lượng), Identity (Danh tính), Diversity (Đa dạng)", False),
                ("Access (Truy cập), Connection (Kết nối), Integration (Tích hợp), Deploy (Triển khai)", False),
                ("Authorization, Confirmation, Inspection, Distribution", False)
            ]
        },
        {
            "id": 4302,
            "text": "Tính chất 'Atomicity' (Tính nguyên tử) trong giao dịch cơ sở dữ liệu bảo đảm điều gì?",
            "exp": "Toàn bộ các thao tác trong giao dịch đều phải thành công trọn vẹn (All), nếu có bất kỳ lỗi nào xảy ra thì toàn bộ phải bị hủy bỏ và rollback về trạng thái ban đầu (Nothing).",
            "choices": [
                ("Dữ liệu được lưu trữ ở cấp độ phân tử hạt nhân", False),
                ("Tất cả các lệnh trong transaction phải thành công trọn vẹn, nếu có 1 lỗi thì rollback toàn bộ", True),
                ("Chỉ một người dùng duy nhất được kết nối vào cơ sở dữ liệu", False),
                ("Dữ liệu sau khi ghi sẽ không bao giờ bị xóa", False)
            ]
        },
        {
            "id": 4303,
            "text": "Cấu trúc dữ liệu phổ biến nhất được sử dụng cho Index trong công cụ lưu trữ InnoDB của MySQL là gì?",
            "exp": "B+Tree (hoặc B-Tree) là cấu trúc cây tìm kiếm cân bằng đa nhánh tối ưu cho việc tìm kiếm theo điểm (Point query) và tìm kiếm theo dải (Range query) trên ổ đĩa.",
            "choices": [
                ("Linked List (Danh sách liên kết đơn)", False),
                ("B+Tree (Cây B-Tree cân bằng)", True),
                ("Binary Search Tree không cân bằng", False),
                ("Queue (Hàng đợi FIFO)", False)
            ]
        },
        {
            "id": 4304,
            "text": "Hiện tượng 'Deadlock' (Khóa chết) xảy ra trong cơ sở dữ liệu khi nào?",
            "exp": "Xảy ra khi hai hoặc nhiều giao dịch đang giữ khóa trên các tài nguyên khác nhau và đồng thời chờ khóa của nhau để tiếp tục, dẫn tới bế tắc vô hạn.",
            "choices": [
                ("Khi ổ đĩa cứng của máy chủ bị mất điện đột ngột", False),
                ("Khi hai giao dịch giữ khóa tài nguyên và chờ đợi khóa của nhau tạo thành vòng lặp bế tắc", True),
                ("Khi người dùng nhập sai mật khẩu đăng nhập quá số lần quy định", False),
                ("Khi chỉ mục Index bị phân mảnh vượt quá 50%", False)
            ]
        },
        {
            "id": 4305,
            "text": "Cú pháp 'SELECT ... FOR UPDATE' trong MySQL được sử dụng nhằm mục đích gì?",
            "exp": "Đặt khóa độc quyền (Exclusive Lock) trên các dòng được đọc, ngăn chặn các transaction khác sửa đổi hoặc đọc với khóa cho đến khi transaction hiện tại kết thúc.",
            "choices": [
                ("Cập nhật ngay lập tức các dòng được chọn thành giá trị rỗng", False),
                ("Đặt khóa độc quyền (Exclusive Lock) lên các dòng đọc được để chống Race Condition", True),
                ("Tự động xóa các bản ghi cũ sau 30 ngày", False),
                ("Chuyển quyền sở hữu bảng cho tài khoản khác", False)
            ]
        },
        {
            "id": 4306,
            "text": "Lệnh công cụ nào được dùng để sao lưu cơ sở dữ liệu MySQL dưới dạng file script SQL văn bản thuần?",
            "exp": "mysqldump là tiện ích dòng lệnh chuẩn đi kèm MySQL để dump cấu trúc và dữ liệu thành các câu lệnh SQL INSERT/CREATE.",
            "choices": [
                ("mysqlimport", False),
                ("mysqldump", True),
                ("mysqladmin backup", False),
                ("mysqlbinlog extract", False)
            ]
        },
        {
            "id": 4307,
            "text": "Tại sao việc tạo quá nhiều Index trên một bảng có thể gây ảnh hưởng tiêu cực đến hiệu năng hệ thống?",
            "exp": "Mỗi khi thực hiện INSERT, UPDATE hoặc DELETE, cơ sở dữ liệu phải tốn thêm thời gian tính toán và ghi để cập nhật lại cấu trúc cây Index tương ứng, làm chậm thao tác ghi.",
            "choices": [
                ("Làm chậm tốc độ đọc dữ liệu của câu lệnh SELECT", False),
                ("Làm suy giảm tốc độ các thao tác ghi (INSERT, UPDATE, DELETE) do phải duy trì cây Index", True),
                ("Làm cho cơ sở dữ liệu tự động chuyển sang chế độ Read-only", False),
                ("Làm sai lệch kết quả tính toán của các hàm SUM và AVG", False)
            ]
        },
        {
            "id": 4308,
            "text": "Mức cô lập (Isolation Level) nào trong chuẩn SQL giúp ngăn chặn hoàn toàn hiện tượng 'Phantom Read' (Đọc bóng ma)?",
            "exp": "Mức cô lập Serializable là mức cao nhất, thực thi các transaction một cách tuần tự (hoặc dùng khóa khoảng cách Range Lock), ngăn chặn hoàn toàn Dirty Read, Non-repeatable Read và Phantom Read.",
            "choices": [
                ("Read Uncommitted", False),
                ("Read Committed", False),
                ("Repeatable Read", False),
                ("Serializable", True)
            ]
        },
        {
            "id": 4309,
            "text": "Khái niệm 'Composite Index' (Chỉ mục kết hợp) trong cơ sở dữ liệu quan hệ được hiểu là gì?",
            "exp": "Là một Index được xây dựng trên hai hoặc nhiều cột của cùng một bảng theo thứ tự xác định (tuân theo nguyên tắc tiền tố bên trái - Leftmost Prefix Rule).",
            "choices": [
                ("Chỉ mục nối giữa hai database khác nhau trên hai máy chủ", False),
                ("Chỉ mục được xây dựng trên tổ hợp từ hai cột trở lên trong cùng một bảng", True),
                ("Chỉ mục chỉ lưu trữ các số nguyên âm", False),
                ("Chỉ mục tự động biến mất khi đóng kết nối", False)
            ]
        },
        {
            "id": 4310,
            "text": "Tính chất 'Durability' (Bền vững) trong ACID bảo đảm điều gì sau khi lệnh COMMIT thành công?",
            "exp": "Bảo đảm rằng một khi giao dịch đã commit thì dữ liệu đã được ghi bền vững vào hệ thống lưu trữ (Write-Ahead Logging / Redo Log) và không bị mất ngay cả khi hệ thống gặp sự cố mất điện.",
            "choices": [
                ("Dữ liệu chỉ tồn tại tạm thời trong bộ nhớ RAM trong 24 giờ", False),
                ("Dữ liệu đã commit được lưu trữ bền vững và không bị mất ngay cả khi crash hoặc mất điện", True),
                ("Cơ sở dữ liệu tự động nén file để tiết kiệm dung lượng", False),
                ("Mọi người dùng đều có thể sửa đổi dữ liệu mà không cần khóa", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 51: HTML & CSS Cơ bản (Category 5)
    # -------------------------------------------------------------
    51: [
        {
            "id": 5101,
            "text": "Thẻ ngữ nghĩa (Semantic HTML5) nào sau đây được khuyến nghị sử dụng để chứa thanh điều hướng chính của trang web?",
            "exp": "Thẻ <nav> đại diện cho khối điều hướng chứa các liên kết chính của trang web.",
            "choices": [
                ("<header>", False),
                ("<nav>", True),
                ("<aside>", False),
                ("<section>", False)
            ]
        },
        {
            "id": 5102,
            "text": "Mô hình hộp CSS Box Model tiêu chuẩn bao gồm những thành phần nào theo thứ tự từ trong ra ngoài?",
            "exp": "Thứ tự từ trong ra ngoài của Box Model: Content (Nội dung) -> Padding (Khoảng đệm) -> Border (Đường viền) -> Margin (Lề ngoài).",
            "choices": [
                ("Content -> Margin -> Border -> Padding", False),
                ("Content -> Padding -> Border -> Margin", True),
                ("Border -> Padding -> Content -> Margin", False),
                ("Margin -> Border -> Padding -> Content", False)
            ]
        },
        {
            "id": 5103,
            "text": "Thuộc tính CSS nào sau đây làm cho tổng chiều rộng của phần tử bao gồm cả Padding và Border thay vì bị cộng dồn thêm?",
            "exp": "box-sizing: border-box giúp việc tính toán kích thước chiều rộng (width) bao trùm cả padding và border, tránh vỡ layout.",
            "choices": [
                ("box-sizing: content-box", False),
                ("box-sizing: border-box", True),
                ("display: inline-block", False),
                ("overflow: hidden", False)
            ]
        },
        {
            "id": 5104,
            "text": "Trong bố cục CSS Flexbox, thuộc tính nào được sử dụng để căn chỉnh các phần tử con theo trục chính (Main Axis)?",
            "exp": "justify-content căn chỉnh các flex items dọc theo trục chính (Main Axis), còn align-items căn chỉnh theo trục chéo (Cross Axis).",
            "choices": [
                ("align-items", False),
                ("align-content", False),
                ("justify-content", True),
                ("flex-direction", False)
            ]
        },
        {
            "id": 5105,
            "text": "Thẻ <meta name='viewport' content='width=device-width, initial-scale=1.0'> trong phần head có vai trò gì?",
            "exp": "Khai báo kích thước viewport bằng chiều rộng màn hình thiết bị và tỉ lệ zoom ban đầu là 1.0, là nền tảng của Responsive Web Design trên di động.",
            "choices": [
                ("Tự động dịch trang web sang tiếng Anh", False),
                ("Khai báo kích thước hiển thị theo thiết bị, kích hoạt giao diện Responsive trên di động", True),
                ("Tăng tốc độ tải file CSS từ máy chủ CDN", False),
                ("Chặn các công cụ tìm kiếm thu thập dữ liệu trang web", False)
            ]
        },
        {
            "id": 5106,
            "text": "Độ ưu tiên (Specificity) của bộ chọn CSS nào sau đây là cao nhất khi áp dụng định kiểu cho phần tử?",
            "exp": "Độ ưu tiên: Inline styles (1000) > ID selector (100) > Class/Attribute/Pseudo-class (10) > Element tag (1). Inline styles có độ ưu tiên cao nhất (nếu không tính cờ !important).",
            "choices": [
                ("Type/Element selector (như p, div)", False),
                ("Class selector (như .btn)", False),
                ("ID selector (như #header)", False),
                ("Inline style (viết trực tiếp trong thuộc tính style của thẻ HTML)", True)
            ]
        },
        {
            "id": 5107,
            "text": "Thuộc tính 'position: absolute' định vị phần tử tương đối so với đối tượng nào?",
            "exp": "Định vị tương đối so với phần tử cha gần nhất có thuộc tính position khác static (như relative, absolute, fixed).",
            "choices": [
                ("Luôn luôn so với cửa sổ trình duyệt (viewport)", False),
                ("Tương đối so với phần tử tổ tiên gần nhất có position khác static", True),
                ("Tương đối so với phần tử đứng liền trước trong DOM", False),
                ("Luôn cố định tại góc trên bên trái của trang màn hình", False)
            ]
        },
        {
            "id": 5108,
            "text": "Media Query trong CSS được sử dụng nhằm mục đích chính nào trong thiết kế web hiện đại?",
            "exp": "Áp dụng các khối quy tắc CSS khác nhau dựa trên đặc điểm của thiết bị hiển thị như chiều rộng màn hình (min-width, max-width), hướng xoay màn hình.",
            "choices": [
                ("Phát video và âm thanh trực tiếp trên trang web", False),
                ("Áp dụng quy tắc CSS tương thích theo kích thước màn hình và thiết bị (Responsive)", True),
                ("Gửi thông tin thống kê người dùng về máy chủ Google Analytics", False),
                ("Nén các file ảnh để giảm dung lượng tải trang", False)
            ]
        },
        {
            "id": 5109,
            "text": "Thuộc tính CSS nào cho phép hiển thị một phần tử dưới dạng lưới hai chiều (hàng và cột)?",
            "exp": "display: grid kích hoạt hệ thống lưới 2 chiều CSS Grid mạnh mẽ cho layout trang web phức tạp.",
            "choices": [
                ("display: flex", False),
                ("display: block", False),
                ("display: inline", False),
                ("display: grid", True)
            ]
        },
        {
            "id": 5110,
            "text": "Thẻ <label> liên kết với thẻ <input> trong biểu mẫu HTML bằng thuộc tính nào để tăng khả năng tiếp cận (Accessibility)?",
            "exp": "Thuộc tính 'for' của thẻ <label> chứa giá trị khớp với 'id' của thẻ <input>, cho phép người dùng click vào nhãn để focus vào ô nhập.",
            "choices": [
                ("Thuộc tính 'name'", False),
                ("Thuộc tính 'for' (khớp với 'id' của input)", True),
                ("Thuộc tính 'value'", False),
                ("Thuộc tính 'placeholder'", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 52: JavaScript & DOM (Category 5)
    # -------------------------------------------------------------
    52: [
        {
            "id": 5201,
            "text": "Sự khác biệt căn bản giữa hai từ khóa khai báo biến 'let' và 'var' trong JavaScript là gì?",
            "exp": "let có phạm vi khối (Block Scope) và không bị gán hoisting khởi tạo, còn var có phạm vi hàm (Function Scope) và có hoisting khởi tạo undefined.",
            "choices": [
                ("var có phạm vi khối (Block scope), let có phạm vi toàn cục", False),
                ("let có phạm vi khối (Block scope), còn var có phạm vi hàm (Function scope)", True),
                ("let không thể gán lại giá trị mới sau khi khai báo", False),
                ("var chỉ dùng cho số, let chỉ dùng cho chuỗi ký tự", False)
            ]
        },
        {
            "id": 5202,
            "text": "Mô hình Event Loop trong JavaScript Runtime giữ vai trò chức năng gì?",
            "exp": "Liên tục theo dõi Call Stack và Callback/Task Queue; khi Call Stack rỗng, nó chuyển các tác vụ bất đồng bộ từ Queue vào Stack để thực thi.",
            "choices": [
                ("Tự động giải phóng bộ nhớ RAM của biến không dùng", False),
                ("Giám sát Call Stack và Task Queue để điều phối thực thi các tác vụ bất đồng bộ", True),
                ("Dịch mã nguồn JavaScript sang mã máy C++", False),
                ("Kiểm tra cú pháp của file HTML", False)
            ]
        },
        {
            "id": 5203,
            "text": "Kỹ thuật 'Event Delegation' (Ủy quyền sự kiện) trong DOM mang lại lợi ích nổi bật nào?",
            "exp": "Gán một event listener duy nhất lên phần tử cha để lắng nghe sự kiện của các phần tử con (nhờ cơ chế Event Bubbling), tiết kiệm bộ nhớ và xử lý tốt phần tử động.",
            "choices": [
                ("Giúp trang web tự động chạy ngay cả khi tắt JavaScript", False),
                ("Lắng nghe sự kiện tập trung ở phần tử cha, tối ưu bộ nhớ và hỗ trợ phần tử động", True),
                ("Tự động gửi request lên server mỗi khi người dùng click chuột", False),
                ("Ngăn chặn trình duyệt mở tab mới", False)
            ]
        },
        {
            "id": 5204,
            "text": "Kết quả của biểu thức so sánh '5' === 5 trong JavaScript là gì và tại sao?",
            "exp": "Toán tử so sánh nghiêm ngặt === (Strict Equality) kiểm tra cả giá trị và kiểu dữ liệu; chuỗi (string) khác số (number) nên kết quả là false.",
            "choices": [
                ("true (vì giá trị đều là 5)", False),
                ("false (vì khác kiểu dữ liệu string và number)", True),
                ("undefined", False),
                ("NaN", False)
            ]
        },
        {
            "id": 5205,
            "text": "Phương thức nào của Promise cho phép thực thi song song nhiều tác vụ và chỉ hoàn thành khi TẤT CẢ các Promise con thành công?",
            "exp": "Promise.all() nhận một mảng các Promise, hoàn thành khi tất cả resolve, hoặc reject ngay khi có bất kỳ Promise nào reject.",
            "choices": [
                ("Promise.race()", False),
                ("Promise.any()", False),
                ("Promise.all()", True),
                ("Promise.resolve()", False)
            ]
        },
        {
            "id": 5206,
            "text": "Phương thức 'event.preventDefault()' trong xử lý sự kiện JavaScript dùng để làm gì?",
            "exp": "Ngăn chặn hành vi mặc định của trình duyệt đối với sự kiện đó (ví dụ: ngăn form reload trang khi submit, ngăn thẻ <a> chuyển trang).",
            "choices": [
                ("Dừng sự kiện lan truyền lên các phần tử cha (Stop Bubbling)", False),
                ("Ngăn chặn hành vi mặc định của trình duyệt cho sự kiện đó", True),
                ("Xóa vĩnh viễn phần tử khỏi cây DOM", False),
                ("Tắt toàn bộ âm thanh trên trang web", False)
            ]
        },
        {
            "id": 5207,
            "text": "Hàm 'document.querySelector()' trả về kết quả gì nếu có nhiều hơn một phần tử khớp với selector?",
            "exp": "document.querySelector() chỉ trả về phần tử đầu tiên khớp với bộ chọn CSS trong DOM; nếu muốn lấy tất cả phải dùng querySelectorAll().",
            "choices": [
                ("Một mảng chứa tất cả các phần tử khớp", False),
                ("Phần tử đầu tiên tìm thấy khớp với bộ chọn CSS", True),
                ("Báo lỗi TypeError và dừng chương trình", False),
                ("Phần tử cuối cùng trong tài liệu", False)
            ]
        },
        {
            "id": 5208,
            "text": "Khái niệm 'Closure' trong JavaScript được giải thích chính xác như thế nào?",
            "exp": "Closure là khả năng một hàm con ghi nhớ và truy cập được vào phạm vi biến (Lexical Scope) của hàm cha bao bọc nó ngay cả khi hàm cha đã thực thi xong.",
            "choices": [
                ("Một hàm tự động đóng tab trình duyệt khi có lỗi", False),
                ("Khả năng hàm ghi nhớ và truy cập vào scope của hàm cha bao bọc nó sau khi hàm cha đã kết thúc", True),
                ("Một thẻ HTML đặc biệt dùng để đóng kết nối websocket", False),
                ("Biến toàn cục không thể bị thay đổi giá trị", False)
            ]
        },
        {
            "id": 5209,
            "text": "Từ khóa 'async/await' trong ES2017 thực chất là cú pháp cú pháp (Syntactic Sugar) dựa trên nền tảng của đối tượng nào?",
            "exp": "async/await được xây dựng dựa trên đối tượng Promise và Generator, giúp viết code bất đồng bộ trông giống như mã đồng bộ tuần tự, dễ đọc và debug.",
            "choices": [
                ("Callback cổ điển", False),
                ("XMLHttpRequest", False),
                ("Promise", True),
                ("Web Worker", False)
            ]
        },
        {
            "id": 5210,
            "text": "Phương thức nào chuyển đổi một chuỗi văn bản định dạng JSON thành đối tượng JavaScript hợp lệ?",
            "exp": "JSON.parse() phân tích chuỗi JSON thành JavaScript Object; ngược lại JSON.stringify() chuyển đối tượng thành chuỗi JSON.",
            "choices": [
                ("JSON.stringify()", False),
                ("JSON.parse()", True),
                ("Object.assign()", False),
                ("String.toJSON()", False)
            ]
        }
    ],

    # -------------------------------------------------------------
    # ĐỀ 53: Node.js, Express & REST API (Category 5)
    # -------------------------------------------------------------
    53: [
        {
            "id": 5301,
            "text": "Kiến trúc mô hình I/O cốt lõi của Node.js hoạt động dựa trên cơ chế nào giúp xử lý hàng ngàn kết nối đồng thời?",
            "exp": "Node.js sử dụng kiến trúc Đơn luồng (Single-threaded) kết hợp Non-blocking I/O và Event-driven thông qua thư viện libuv.",
            "choices": [
                ("Đơn luồng (Single-thread), Bất đồng bộ Non-blocking I/O và Hướng sự kiện", True),
                ("Mỗi kết nối client tạo một tiến trình Process mới của hệ điều hành", False),
                ("Đa luồng đồng bộ chặn toàn bộ (Multi-thread Blocking I/O)", False),
                ("Chạy độc quyền trên phần cứng đa nhân của GPU", False)
            ]
        },
        {
            "id": 5302,
            "text": "Trong Express.js, tham số thứ ba 'next' trong hàm middleware (req, res, next) giữ nhiệm vụ gì?",
            "exp": "Hàm next() chuyển quyền điều khiển và luồng xử lý sang middleware hoặc route handler tiếp theo trong chuỗi xử lý (pipeline).",
            "choices": [
                ("Kết thúc request và gửi phản hồi về cho client", False),
                ("Chuyển quyền điều khiển tới middleware tiếp theo trong chuỗi", True),
                ("Khởi động lại tiến trình Node.js khi gặp lỗi", False),
                ("Xóa cache của trình duyệt người dùng", False)
            ]
        },
        {
            "id": 5303,
            "text": "Nguyên tắc Idempotent (Tính bất biến khi gọi lại) trong thiết kế RESTful API áp dụng cho các phương thức HTTP nào?",
            "exp": "Các phương thức GET, PUT, DELETE, HEAD mang tính Idempotent (gọi 1 lần hay nhiều lần cùng tham số đều cho kết quả trạng thái hệ thống nhất quán); POST không phải là idempotent.",
            "choices": [
                ("Chỉ áp dụng duy nhất cho phương thức POST", False),
                ("Áp dụng cho GET, PUT, DELETE, HEAD (gọi nhiều lần không đổi trạng thái hệ thống)", True),
                ("Áp dụng cho tất cả các phương thức không có ngoại lệ", False),
                ("Không có phương thức HTTP nào mang tính Idempotent", False)
            ]
        },
        {
            "id": 5304,
            "text": "Mã trạng thái HTTP nào là chuẩn mực nhất để phản hồi cho yêu cầu tạo mới tài nguyên thành công qua POST?",
            "exp": "HTTP 201 Created được dùng để phản hồi khi một tài nguyên mới đã được tạo thành công trên server.",
            "choices": [
                ("200 OK", False),
                ("204 No Content", False),
                ("201 Created", True),
                ("202 Accepted", False)
            ]
        },
        {
            "id": 5305,
            "text": "Middleware 'express.json()' trong ứng dụng Express.js thực hiện nhiệm vụ gì?",
            "exp": "Phân tích (parse) nội dung body của request gửi lên có header Content-Type: application/json và gán dữ liệu vào req.body.",
            "choices": [
                ("Tự động chuyển đổi toàn bộ mã nguồn Express thành JSON", False),
                ("Parse request body có định dạng JSON và gán vào thuộc tính req.body", True),
                ("Mã hóa database MySQL thành các file JSON sao lưu", False),
                ("Chặn các request gửi dữ liệu dạng JSON", False)
            ]
        },
        {
            "id": 5306,
            "text": "Cơ chế CORS (Cross-Origin Resource Sharing) được thực thi và kiểm tra bởi thành phần nào?",
            "exp": "CORS là cơ chế bảo mật do chính trình duyệt web (Browser) thực thi để bảo vệ người dùng, server chỉ cấu hình các HTTP header cho phép (như Access-Control-Allow-Origin).",
            "choices": [
                ("Do cơ sở dữ liệu MySQL kiểm tra", False),
                ("Do chính Trình duyệt web (Browser) của client kiểm tra và thực thi", True),
                ("Do hệ điều hành Linux của server chặn", False),
                ("Do nhà mạng cung cấp dịch vụ Internet ISP quyết định", False)
            ]
        },
        {
            "id": 5307,
            "text": "Phương thức HTTP nào được thiết kế chuẩn mực cho việc cập nhật MỘT PHẦN (Partial Update) của tài nguyên trong REST API?",
            "exp": "PATCH dùng để cập nhật một phần tài nguyên; trong khi PUT thay thế toàn bộ tài nguyên hiện có bằng dữ liệu mới.",
            "choices": [
                ("PUT", False),
                ("PATCH", True),
                ("POST", False),
                ("UPDATE", False)
            ]
        },
        {
            "id": 5308,
            "text": "Thư viện 'helmet' trong Node.js/Express cung cấp tính năng bảo mật nào cho ứng dụng?",
            "exp": "Helmet tự động thiết lập các HTTP Security Headers chuẩn (như CSP, X-Frame-Options, X-Content-Type-Options, HSTS) để bảo vệ ứng dụng khỏi các cuộc tấn công web phổ biến.",
            "choices": [
                ("Mã hóa ổ đĩa cứng của máy chủ web", False),
                ("Thiết lập tự động các HTTP Security Headers an toàn bảo vệ ứng dụng", True),
                ("Quét virus trong file upload của người dùng", False),
                ("Thay thế tường lửa phần cứng của trung tâm dữ liệu", False)
            ]
        },
        {
            "id": 5309,
            "text": "Trong Error-handling middleware của Express.js, hàm bắt buộc phải có đủ bao nhiêu tham số đầu vào?",
            "exp": "Error-handling middleware trong Express được nhận diện nhờ có đúng 4 tham số: (err, req, res, next).",
            "choices": [
                ("2 tham số: (req, res)", False),
                ("3 tham số: (req, res, next)", False),
                ("4 tham số: (err, req, res, next)", True),
                ("1 tham số duy nhất: (err)", False)
            ]
        },
        {
            "id": 5310,
            "text": "Biến toàn cục 'process.env' trong môi trường Node.js chứa loại thông tin nào?",
            "exp": "process.env chứa các biến môi trường (Environment Variables) của hệ điều hành hoặc file .env được nạp khi khởi động ứng dụng.",
            "choices": [
                ("Lịch sử các câu lệnh git commit gần nhất", False),
                ("Các biến môi trường (Environment Variables) của tiến trình ứng dụng", True),
                ("Danh sách toàn bộ mật khẩu người dùng đã hash", False),
                ("Dung lượng pin còn lại của máy chủ", False)
            ]
        }
    ]
}

print("New exams defined:", len(new_exams_data))

