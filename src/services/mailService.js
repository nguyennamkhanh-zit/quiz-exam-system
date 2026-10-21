const nodemailer = require("nodemailer");

/**
 * Mailer service sử dụng Nodemailer chính thức
 * Hỗ trợ Gmail SMTP (cổng 465 SSL hoặc 587 STARTTLS) với Mật khẩu ứng dụng (App Password)
 * Khi chưa cấu hình SMTP_USER / SMTP_PASS, tự động chuyển sang mock mode để phục vụ test và development an toàn
 */
class MailerService {
  constructor() {
    this.host = process.env.SMTP_HOST || "smtp.gmail.com";
    this.port = parseInt(process.env.SMTP_PORT || "465", 10);
    this.secure = process.env.SMTP_SECURE === "true" || this.port === 465;
    this.user = process.env.SMTP_USER || "";
    this.pass = process.env.SMTP_PASS || "";
    this.from = process.env.SMTP_FROM || this.user || "no-reply@quizexam.local";

    this.mock = !this.user || !this.pass;
    this.sentEmails = []; // Bộ nhớ đệm lưu email giả lập cho test

    if (!this.mock) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: {
          user: this.user,
          pass: this.pass,
        },
        // Giới hạn timeout tránh treo tiến trình
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    } else {
      this.transporter = null;
    }
  }

  async sendMail({ to, subject, text, html }) {
    if (this.mock) {
      const emailRecord = {
        to,
        from: this.from,
        subject,
        text,
        html,
        sentAt: new Date().toISOString(),
      };
      this.sentEmails.push(emailRecord);
      if (this.sentEmails.length > 50) this.sentEmails.shift();
      return {
        success: true,
        mock: true,
        messageId: `<mock-${Date.now()}@quizexam.local>`,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"QuizExam System" <${this.from}>`,
        to,
        subject,
        text,
        html,
      });
      return {
        success: true,
        mock: false,
        messageId: info.messageId,
      };
    } catch (err) {
      console.error("[NODEMAILER_ERROR] Gửi email thất bại:", err.message);
      throw err;
    }
  }

  // Phương thức đóng kết nối an toàn khi test kết thúc
  close() {
    if (this.transporter && typeof this.transporter.close === "function") {
      this.transporter.close();
    }
  }
}

const mailer = new MailerService();

module.exports = {
  MailerService,
  mailer,
};
