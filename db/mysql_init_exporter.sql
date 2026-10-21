-- Tạo tài khoản exporter với quyền tối thiểu (PROCESS, REPLICATION CLIENT, SELECT trên performance_schema)
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY 'ExporterPass@123456' WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
