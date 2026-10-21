// Client State
let currentUser = null;
let currentAttempt = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let timerInterval = null;

// Category & Search Filter State
let currentCategoryFilter = "all";
let currentSearchKeyword = "";
let cachedCategories = [];

// Helper đọc Cookie phía client
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Helper tránh XSS khi render văn bản
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Request Wrapper với bảo vệ CSRF Token tự động
async function apiRequest(url, options = {}) {
  const headers = options.headers || {};
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Tự động gắn CSRF token từ cookie
  const csrfToken = getCookie("csrf_token");
  if (csrfToken && !["GET", "HEAD"].includes(options.method || "GET")) {
    headers["x-csrf-token"] = csrfToken;
  }

  options.headers = headers;
  options.credentials = "same-origin";

  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok && !data.success) {
    throw new Error(data.message || "Đã xảy ra lỗi kết nối");
  }
  return data;
}

// Khởi động ứng dụng
document.addEventListener("DOMContentLoaded", async () => {
  setupGlobalEvents();
  await checkAuth();
  handleHashChange();
});

window.addEventListener("hashchange", () => {
  handleHashChange();
});

function handleHashChange() {
  const hash = window.location.hash.replace("#", "") || "home";
  const [view, param] = hash.split("/");
  navigate(view, param);
}

function setupGlobalEvents() {
  // Event delegation cho toàn bộ thao tác click trong trang
  document.addEventListener("click", async (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.getAttribute("data-action");
    const param = target.getAttribute("data-param");
    const param2 = target.getAttribute("data-param2");

    if (target.tagName.toLowerCase() === "a" || target.getAttribute("href") === "#") {
      e.preventDefault();
    }

    switch (action) {
      case "nav":
        navigate(param, param2);
        break;
      case "logout":
        await handleLogout();
        break;
      case "refresh-home":
        currentCategoryFilter = "all";
        currentSearchKeyword = "";
        renderHomeView(document.getElementById("app"));
        break;
      case "filter-category":
        currentCategoryFilter = param || "all";
        renderHomeView(document.getElementById("app"));
        break;
      case "clear-search":
        currentSearchKeyword = "";
        renderHomeView(document.getElementById("app"));
        break;
      case "start-exam":
        await startExamAction(parseInt(param, 10));
        break;
      case "change-question":
        changeQuestion(parseInt(param, 10));
        break;
      case "toggle-password": {
        const inputId = target.getAttribute("data-target-input");
        if (inputId) {
          const inputEl = document.getElementById(inputId);
          if (inputEl) {
            const isPassword = inputEl.type === "password";
            inputEl.type = isPassword ? "text" : "password";
            target.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
            target.setAttribute("title", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
            target.innerHTML = isPassword
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
          }
        }
        break;
      }
      case "jump-question":
        jumpToQuestion(parseInt(param, 10));
        break;
      case "select-choice":
        await selectChoiceAction(parseInt(param, 10), parseInt(param2, 10));
        break;
      case "submit-exam":
        await submitExamAction();
        break;
      case "admin-create-exam":
        await showCreateExamModal();
        break;
      case "admin-edit-exam":
        await showEditExamModal(parseInt(param, 10));
        break;
      case "admin-manage-categories":
        await showManageCategoriesModal();
        break;
      case "admin-view-questions":
        await viewExamQuestions(parseInt(param, 10));
        break;
      case "admin-view-results":
        await viewExamResultsAdmin(parseInt(param, 10));
        break;
      case "admin-show-add-q":
        showAddQuestionForm(parseInt(param, 10));
        break;
      case "admin-hide-add-q": {
        const box = document.getElementById("add-q-form-box");
        if (box) box.style.display = "none";
        break;
      }
      case "admin-submit-q":
        await submitNewQuestion(parseInt(param, 10));
        break;
      case "admin-delete-q":
        await deleteQuestionAction(parseInt(param, 10), parseInt(param2, 10));
        break;
      case "admin-save-exam-status":
        await saveExamStatusAction(parseInt(param, 10));
        break;
      case "admin-delete-exam":
        await deleteExamAction(parseInt(param, 10), param2);
        break;
      case "admin-restore-exam":
        await restoreExamAction(parseInt(param, 10), param2);
        break;
      case "admin-refresh-audit":
        await loadAuditLogs();
        break;
      case "admin-refresh-loki":
        await loadLokiLogs();
        break;
      default:
        break;
    }
  });

  // Event delegation cho tìm kiếm (submit form hoặc input enter)
  document.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "search-exam-form") {
      e.preventDefault();
      const input = document.getElementById("exam-search-input");
      if (input) {
        currentSearchKeyword = input.value.trim();
        renderHomeView(document.getElementById("app"));
      }
    }
  });

  // Event delegation cho thẻ select thay đổi trạng thái đề thi
  document.addEventListener("change", (e) => {
    const target = e.target.closest("[data-onchange]");
    if (!target) return;
    const action = target.getAttribute("data-onchange");
    const param = target.getAttribute("data-param");

    if (action === "update-exam-status") {
      const examId = parseInt(param, 10);
      const originalStatus = target.getAttribute("data-original-status");
      const noticeEl = document.getElementById(`unsaved-notice-${examId}`);
      const saveBtn = document.getElementById(`save-btn-${examId}`);
      const isChanged = target.value !== originalStatus;

      if (noticeEl) {
        noticeEl.style.display = isChanged ? "inline-block" : "none";
      }
      if (saveBtn) {
        saveBtn.disabled = !isChanged;
        saveBtn.className = isChanged ? "btn btn-primary" : "btn btn-secondary";
      }
    }
  });
}

async function checkAuth() {
  try {
    const res = await apiRequest("/api/auth/me");
    currentUser = res.user;
  } catch (err) {
    currentUser = null;
  }
  renderNav();
}

function renderNav() {
  const nav = document.getElementById("nav-actions");
  if (!nav) return;

  if (currentUser) {
    let adminBtn = "";
    const roleLabel = currentUser.role === "admin" ? "Quản trị viên" : "Thí sinh";
    const roleBadgeClass = currentUser.role === "admin" ? "badge-admin" : "badge-student";

    if (currentUser.role === "admin") {
      adminBtn = `
        <button class="btn btn-secondary" data-action="nav" data-target="admin" data-param="admin">Quản Lý Đề</button>
        <button class="btn btn-secondary" data-action="nav" data-target="admin-trash" data-param="admin-trash" title="Thùng rác đề thi">🗑 Thùng Rác</button>
        <button class="btn btn-secondary" data-action="nav" data-target="admin-logs" data-param="admin-logs" title="Nhật ký hệ thống">📋 Nhật Ký Hệ Thống</button>
      `;
    }
    nav.innerHTML = `
      ${adminBtn}
      <button class="btn btn-secondary" data-action="nav" data-target="history" data-param="history">Lịch Sử Thi</button>
      <span class="user-badge" title="Tài khoản hiện tại">
        <strong>${currentUser.full_name || currentUser.username}</strong>
        <span style="display: inline-block; margin-left: 0.35rem; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; background: ${currentUser.role === "admin" ? "#fef3c7; color: #92400e;" : "#dbeafe; color: #1e40af;"}">
          ${roleLabel}
        </span>
      </span>
      <button class="btn btn-danger" data-action="logout">Đăng Xuất</button>
    `;
  } else {
    nav.innerHTML = `
      <button class="btn btn-secondary" data-action="nav" data-target="login" data-param="login">Đăng Nhập</button>
      <button class="btn btn-primary" data-action="nav" data-target="register" data-param="register">Đăng Ký</button>
    `;
  }
}

async function handleLogout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
    currentUser = null;
    renderNav();
    navigate("login");
  } catch (err) {
    alert(err.message);
  }
}

function navigate(view, param = null) {
  const hash = `#${view}${param ? "/" + param : ""}`;
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const app = document.getElementById("app");
  if (!app) return;

  if (view === "login") return renderLoginView(app);
  if (view === "register") return renderRegisterView(app);
  if (view === "forgot-password") return renderForgotPasswordView(app);
  if (view === "reset-password") return renderResetPasswordView(app, param);
  if (view === "home") return renderHomeView(app);
  if (view === "admin") return renderAdminView(app);
  if (view === "admin-trash") return renderAdminTrashView(app);
  if (view === "admin-logs") return renderAdminLogsView(app);
  if (view === "history") return renderHistoryView(app);
  if (view === "exam-detail") return renderExamDetailView(app, param);
  if (view === "quiz") return renderQuizView(app, param);
  if (view === "review") return renderReviewView(app, param);
  renderHomeView(app);
}

// Helper render nút mắt xem/ẩn mật khẩu an toàn
function renderPasswordToggleBtn(targetInputId) {
  return `
    <button type="button" class="password-toggle-btn" data-action="toggle-password" data-target-input="${targetInputId}" aria-label="Hiện mật khẩu" title="Hiện mật khẩu">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    </button>
  `;
}

// 1. Màn hình Đăng Nhập
function renderLoginView(container) {
  container.innerHTML = `
    <div style="max-width: 420px; margin: 3rem auto;">
      <div class="card">
        <h2 class="card-title">Đăng Nhập Hệ Thống</h2>
        <div id="login-alert"></div>
        <form id="login-form">
          <div class="form-group">
            <label>Tên đăng nhập hoặc Email:</label>
            <input type="text" id="login-input" class="form-control" required placeholder="admin hoặc student1@ictu.edu.vn">
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label style="margin-bottom: 0;">Mật khẩu:</label>
              <a href="#" data-action="nav" data-param="forgot-password" style="font-size: 0.8125rem; color: var(--primary);">Quên mật khẩu?</a>
            </div>
            <div class="password-input-group">
              <input type="password" id="password-input" class="form-control" required placeholder="••••••••">
              ${renderPasswordToggleBtn("password-input")}
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Đăng Nhập</button>
        </form>
        <p style="text-align: center; margin-top: 1rem; font-size: 0.875rem;">
          Chưa có tài khoản? <a href="#" data-action="nav" data-param="register">Đăng ký thí sinh ngay</a>
        </p>
      </div>
    </div>
  `;

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const login = document.getElementById("login-input").value.trim();
    const password = document.getElementById("password-input").value;
    try {
      const res = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      currentUser = res.user;
      renderNav();
      navigate("home");
    } catch (err) {
      document.getElementById("login-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

// 2. Màn hình Đăng Ký
function renderRegisterView(container) {
  container.innerHTML = `
    <div style="max-width: 480px; margin: 2rem auto;">
      <div class="card">
        <h2 class="card-title">Đăng Ký Tài Khoản Thí Sinh</h2>
        <div id="reg-alert"></div>
        <form id="reg-form">
          <div class="form-group">
            <label>Họ và Tên:</label>
            <input type="text" id="reg-name" class="form-control" required placeholder="Nguyễn Văn A">
          </div>
          <div class="form-group">
            <label>Tên đăng nhập:</label>
            <input type="text" id="reg-username" class="form-control" required placeholder="nguyenvana">
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input type="email" id="reg-email" class="form-control" required placeholder="vana@ictu.edu.vn">
          </div>
          <div class="form-group">
            <label>Mật khẩu (tối thiểu 6 ký tự):</label>
            <div class="password-input-group">
              <input type="password" id="reg-password" class="form-control" required placeholder="••••••••">
              ${renderPasswordToggleBtn("reg-password")}
            </div>
          </div>
          <div class="form-group">
            <label>Xác nhận mật khẩu:</label>
            <div class="password-input-group">
              <input type="password" id="reg-confirm-password" class="form-control" required placeholder="••••••••">
              ${renderPasswordToggleBtn("reg-confirm-password")}
            </div>
          </div>
          <button type="submit" class="btn btn-success" style="width: 100%;">Tạo Tài Khoản</button>
        </form>
        <p style="text-align: center; margin-top: 1rem; font-size: 0.875rem;">
          Đã có tài khoản? <a href="#" data-action="nav" data-param="login">Đăng nhập</a>
        </p>
      </div>
    </div>
  `;

  document.getElementById("reg-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("reg-name").value.trim();
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value;

    if (password !== confirmPassword) {
      document.getElementById("reg-alert").innerHTML = `<div class="alert alert-error">Mật khẩu xác nhận không khớp!</div>`;
      return;
    }

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name, username, email, password }),
      });
      alert("Đăng ký thành công! Hãy đăng nhập để bắt đầu thi.");
      navigate("login");
    } catch (err) {
      document.getElementById("reg-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

// 2b. Màn hình Quên Mật Khẩu
function renderForgotPasswordView(container) {
  container.innerHTML = `
    <div style="max-width: 440px; margin: 3rem auto;">
      <div class="card">
        <h2 class="card-title">Quên Mật Khẩu</h2>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          Nhập địa chỉ email tài khoản đã đăng ký. Hệ thống sẽ gửi cho bạn liên kết đặt lại mật khẩu an toàn có hiệu lực trong 15 phút.
        </p>
        <div id="forgot-alert"></div>
        <form id="forgot-form">
          <div class="form-group">
            <label>Địa chỉ Email:</label>
            <input type="email" id="forgot-email" class="form-control" required placeholder="vidu@ictu.edu.vn">
          </div>
          <button type="submit" id="btn-forgot-submit" class="btn btn-primary" style="width: 100%;">
            Gửi Liên Kết Đặt Lại Mật Khẩu
          </button>
        </form>
        <p style="text-align: center; margin-top: 1rem; font-size: 0.875rem;">
          Nhớ lại mật khẩu? <a href="#" data-action="nav" data-param="login">Quay lại Đăng nhập</a>
        </p>
      </div>
    </div>
  `;

  document.getElementById("forgot-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgot-email").value.trim();
    const btn = document.getElementById("btn-forgot-submit");
    btn.disabled = true;
    btn.textContent = "Đang gửi...";

    try {
      const res = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      document.getElementById("forgot-alert").innerHTML = `
        <div class="alert alert-success">${res.message}</div>
      `;
      document.getElementById("forgot-form").reset();
    } catch (err) {
      document.getElementById("forgot-alert").innerHTML = `
        <div class="alert alert-error">${err.message}</div>
      `;
    } finally {
      btn.disabled = false;
      btn.textContent = "Gửi Liên Kết Đặt Lại Mật Khẩu";
    }
  });
}

// 2c. Màn hình Đặt Lại Mật Khẩu Mới
async function renderResetPasswordView(container, token) {
  if (!token) {
    container.innerHTML = `
      <div style="max-width: 440px; margin: 3rem auto;">
        <div class="card">
          <div class="alert alert-error">Thiếu mã token đặt lại mật khẩu. Vui lòng kiểm tra lại liên kết trong email.</div>
          <p style="text-align: center; margin-top: 1rem;">
            <a href="#" data-action="nav" data-param="forgot-password">Yêu cầu liên kết mới</a>
          </p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="max-width: 440px; margin: 3rem auto;">
      <div class="card">
        <h2 class="card-title">Đặt Lại Mật Khẩu Mới</h2>
        <div id="reset-loading" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
          Đang xác thực liên kết...
        </div>
        <div id="reset-alert"></div>
        <div id="reset-content" style="display: none;">
          <form id="reset-form">
            <div class="form-group">
              <label>Mật khẩu mới (tối thiểu 6 ký tự):</label>
              <div class="password-input-group">
                <input type="password" id="reset-new-password" class="form-control" required placeholder="••••••••">
                ${renderPasswordToggleBtn("reset-new-password")}
              </div>
            </div>
            <div class="form-group">
              <label>Xác nhận mật khẩu mới:</label>
              <div class="password-input-group">
                <input type="password" id="reset-confirm-password" class="form-control" required placeholder="••••••••">
                ${renderPasswordToggleBtn("reset-confirm-password")}
              </div>
            </div>
            <button type="submit" id="btn-reset-submit" class="btn btn-primary" style="width: 100%;">
              Lưu Mật Khẩu Mới
            </button>
          </form>
        </div>
        <p style="text-align: center; margin-top: 1rem; font-size: 0.875rem;">
          <a href="#" data-action="nav" data-param="login">Quay lại Đăng nhập</a>
        </p>
      </div>
    </div>
  `;

  // Kiểm tra token trước bằng GET (không tiêu thụ token)
  try {
    await apiRequest(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
    document.getElementById("reset-loading").style.display = "none";
    document.getElementById("reset-content").style.display = "block";

    document.getElementById("reset-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const new_password = document.getElementById("reset-new-password").value;
      const confirm_password = document.getElementById("reset-confirm-password").value;

      if (new_password !== confirm_password) {
        document.getElementById("reset-alert").innerHTML = `<div class="alert alert-error">Mật khẩu xác nhận không khớp!</div>`;
        return;
      }

      const btn = document.getElementById("btn-reset-submit");
      btn.disabled = true;
      btn.textContent = "Đang lưu...";

      try {
        const res = await apiRequest("/api/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ token, new_password, confirm_password }),
        });
        alert(res.message);
        navigate("login");
      } catch (err) {
        document.getElementById("reset-alert").innerHTML = `<div class="alert alert-error">${err.message}</div>`;
        btn.disabled = false;
        btn.textContent = "Lưu Mật Khẩu Mới";
      }
    });
  } catch (err) {
    document.getElementById("reset-loading").style.display = "none";
    document.getElementById("reset-alert").innerHTML = `
      <div class="alert alert-error">${err.message}</div>
      <p style="text-align: center; margin-top: 1rem;">
        <a href="#" data-action="nav" data-param="forgot-password" class="btn btn-secondary">Yêu cầu liên kết mới</a>
      </p>
    `;
  }
}


// 3. Màn hình Trang Chủ (Danh sách đề thi kèm lọc Danh Mục và Tìm Kiếm)
async function renderHomeView(container) {
  if (!currentUser) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem;">
        <h1 style="font-size: 2.25rem; font-weight: 800; color: #1e3a8a; margin-bottom: 1rem;">
          Hệ Thống Thi Trắc Nghiệm Trực Tuyến
        </h1>
        <p style="font-size: 1.125rem; color: #64748b; max-width: 600px; margin: 0 auto 2rem auto;">
          Nền tảng kiểm tra, đánh giá kiến thức với đồng hồ đếm ngược server-side, tự động chốt bài và lưu snapshot đề thi bảo mật.
        </p>
        <div>
          <button class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 1rem;" data-action="nav" data-param="login">
            Đăng Nhập Ngay
          </button>
          <button class="btn btn-secondary" style="padding: 0.75rem 1.5rem; font-size: 1rem; margin-left: 0.5rem;" data-action="nav" data-param="register">
            Đăng Ký Tài Khoản
          </button>
        </div>
      </div>
    `;
    return;
  }

  try {
    // Tải danh sách Categories và Exams song song
    const queryParams = new URLSearchParams();
    if (currentCategoryFilter && currentCategoryFilter !== "all") {
      queryParams.append("category", currentCategoryFilter);
    }
    if (currentSearchKeyword) {
      queryParams.append("search", currentSearchKeyword);
    }

    const [catRes, examRes] = await Promise.all([
      apiRequest("/api/categories"),
      apiRequest(`/api/exams?${queryParams.toString()}`),
    ]);

    cachedCategories = catRes.categories || [];
    const uncategorizedInfo = catRes.uncategorized || { published_exam_count: 0, total_exam_count: 0 };
    const exams = examRes.exams || [];

    // Tính tổng số bài đã công bố
    const totalPublished = cachedCategories.reduce((acc, c) => acc + (c.published_exam_count || 0), 0) + (uncategorizedInfo.published_exam_count || 0);

    let html = `
      <div class="card-title">
        <h2>Danh Sách Đề Thi Khả Dụng</h2>
        <button class="btn btn-secondary" data-action="refresh-home">Làm Mới</button>
      </div>

      <!-- Thanh Tìm Kiếm -->
      <form id="search-exam-form" class="search-box-wrapper">
        <input type="text" id="exam-search-input" class="form-control" placeholder="Tìm kiếm theo tiêu đề bài thi..." value="${currentSearchKeyword}">
        <button type="submit" class="btn btn-primary">Tìm kiếm</button>
        ${currentSearchKeyword ? `<button type="button" class="btn btn-secondary" data-action="clear-search">Xóa lọc</button>` : ""}
      </form>

      <!-- Thanh Lọc Danh Mục (Filter Pills) -->
      <div class="category-filter-bar">
        <button class="filter-pill ${currentCategoryFilter === "all" ? "active" : ""}" data-action="filter-category" data-param="all">
          Tất cả <span class="pill-count">${totalPublished}</span>
        </button>
    `;

    cachedCategories.forEach((cat) => {
      const isActive = currentCategoryFilter === cat.slug;
      html += `
        <button class="filter-pill ${isActive ? "active" : ""}" data-action="filter-category" data-param="${cat.slug}">
          ${cat.name} <span class="pill-count">${cat.published_exam_count}</span>
        </button>
      `;
    });

    if (uncategorizedInfo.published_exam_count > 0) {
      const isUncatActive = currentCategoryFilter === "uncategorized";
      html += `
        <button class="filter-pill ${isUncatActive ? "active" : ""}" data-action="filter-category" data-param="uncategorized">
          Khác <span class="pill-count">${uncategorizedInfo.published_exam_count}</span>
        </button>
      `;
    }

    html += `</div>`;

    // Khung hiển thị danh sách đề thi
    if (exams.length === 0) {
      html += `
        <div class="card" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem auto; display: block; opacity: 0.5;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p style="font-size: 1.125rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem;">Không tìm thấy bài thi phù hợp</p>
          <p style="font-size: 0.875rem;">Không có bài thi nào khớp với bộ lọc danh mục hoặc từ khóa tìm kiếm "${currentSearchKeyword}".</p>
          <div style="margin-top: 1rem;">
            <button class="btn btn-secondary" data-action="refresh-home">Xem tất cả bài thi</button>
          </div>
        </div>
      `;
    } else {
      html += `<div class="exam-grid">`;
      exams.forEach((exam) => {
        html += `
          <div class="exam-card">
            <div>
              <span class="category-badge">${exam.category_name || "Chưa phân loại"}</span>
              <h3>${exam.title}</h3>
              <p style="font-size: 0.875rem; color: #475569; margin-bottom: 0.75rem;">
                ${exam.description || "Không có mô tả"}
              </p>
              <div class="exam-meta">
                <div>⏱ Thời lượng: <strong>${exam.duration_minutes} phút</strong></div>
                <div>🎯 Điểm đạt: <strong>${parseFloat(exam.passing_score).toFixed(1)} / 10</strong></div>
                <div>📝 Số câu hỏi: <strong>${exam.question_count} câu</strong></div>
              </div>
            </div>
            <button class="btn btn-primary" data-action="start-exam" data-param="${exam.id}">
              Bắt Đầu Làm Bài
            </button>
          </div>
        `;
      });
      html += `</div>`;
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// Bắt đầu thi
async function startExamAction(examId) {
  if (!confirm("Bạn có chắc chắn muốn bắt đầu lượt thi này? Đồng hồ sẽ bắt đầu đếm ngược.")) {
    return;
  }
  try {
    const res = await apiRequest(`/api/attempts/start/${examId}`, { method: "POST" });
    navigate("quiz", res.attemptId);
  } catch (err) {
    alert("Không thể bắt đầu lượt thi: " + err.message);
  }
}

// 4. Màn hình Làm Bài Thi
async function renderQuizView(container, attemptId) {
  try {
    const res = await apiRequest(`/api/attempts/${attemptId}`);
    currentAttempt = res.attempt;
    currentQuestions = res.questions;
    currentQuestionIndex = 0;

    if (currentAttempt.status !== "in_progress") {
      alert("Lượt thi này đã kết thúc.");
      return navigate("review", attemptId);
    }

    container.innerHTML = `
      <div class="card">
        <div class="quiz-header">
          <div>
            <h2 style="font-size: 1.25rem;">${currentAttempt.exam_title}</h2>
            <span style="font-size: 0.875rem; color: var(--text-muted);">Lượt thi #${currentAttempt.id}</span>
          </div>
          <div class="timer-box" id="timer-display">
            ⏱ <span id="countdown">--:--</span>
          </div>
        </div>

        <!-- Bảng số thứ tự câu hỏi -->
        <div class="question-nav" id="q-nav-list"></div>

        <!-- Khung hiển thị câu hỏi hiện tại -->
        <div id="q-content-box" style="margin-bottom: 1.5rem; min-height: 220px;"></div>

        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 1rem;">
          <div>
            <button class="btn btn-secondary" id="btn-prev" data-action="change-question" data-param="-1">← Câu trước</button>
            <button class="btn btn-secondary" id="btn-next" data-action="change-question" data-param="1">Câu tiếp →</button>
          </div>
          <button class="btn btn-danger" data-action="submit-exam">Nộp Bài Thi</button>
        </div>
      </div>
    `;

    renderQuestionNav();
    showCurrentQuestion();
    startCountdown(currentAttempt.due_at);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function parseServerDate(dateStr) {
  if (!dateStr) return 0;
  if (typeof dateStr === "number") return dateStr;
  let str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str) && !str.endsWith("Z")) {
    str = str.replace(" ", "T") + "Z";
  }
  return new Date(str).getTime();
}

function startCountdown(dueAtStr) {
  if (timerInterval) clearInterval(timerInterval);

  const dueTime = parseServerDate(dueAtStr);

  function update() {
    const now = new Date().getTime();
    const remaining = dueTime - now;

    const timerBox = document.getElementById("timer-display");
    const countSpan = document.getElementById("countdown");

    if (remaining <= 0) {
      if (countSpan) countSpan.textContent = "00:00 (Hết giờ)";
      clearInterval(timerInterval);
      alert("Đã hết thời gian làm bài! Hệ thống tự động nộp bài.");
      submitExamAction(true);
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (countSpan) {
      countSpan.textContent = `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    if (remaining < 3 * 60 * 1000) {
      if (timerBox) timerBox.className = "timer-box";
    } else {
      if (timerBox) timerBox.className = "timer-box normal";
    }
  }

  update();
  timerInterval = setInterval(update, 1000);
}

function renderQuestionNav() {
  const navBox = document.getElementById("q-nav-list");
  if (!navBox) return;

  let html = "";
  currentQuestions.forEach((q, idx) => {
    const isAnswered = q.selected_choice_id !== null && q.selected_choice_id !== undefined;
    const isActive = idx === currentQuestionIndex;
    let cls = "q-btn";
    if (isAnswered) cls += " answered";
    if (isActive) cls += " active";

    html += `<button class="${cls}" data-action="jump-question" data-param="${idx}">${idx + 1}</button>`;
  });
  navBox.innerHTML = html;
}

function showCurrentQuestion() {
  const box = document.getElementById("q-content-box");
  if (!box || currentQuestions.length === 0) return;

  const q = currentQuestions[currentQuestionIndex];

  let html = `
    <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">
      Câu ${currentQuestionIndex + 1}: ${q.question_text}
    </h3>
    <div class="choices-list">
  `;

  q.choices.forEach((c) => {
    const isSelected = q.selected_choice_id === c.id;
    html += `
      <label class="choice-label ${isSelected ? "selected" : ""}" data-action="select-choice" data-param="${q.id}" data-param2="${c.id}">
        <input type="radio" name="q_${q.id}" value="${c.id}" ${isSelected ? "checked" : ""}>
        <span>${c.choice_text}</span>
      </label>
    `;
  });

  html += `</div>`;
  box.innerHTML = html;

  // Cập nhật trạng thái nút Prev/Next
  const prevBtn = document.getElementById("btn-prev");
  const nextBtn = document.getElementById("btn-next");
  if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
  if (nextBtn) nextBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;
}

function changeQuestion(delta) {
  const newIndex = currentQuestionIndex + delta;
  if (newIndex >= 0 && newIndex < currentQuestions.length) {
    currentQuestionIndex = newIndex;
    renderQuestionNav();
    showCurrentQuestion();
  }
}

function jumpToQuestion(idx) {
  currentQuestionIndex = idx;
  renderQuestionNav();
  showCurrentQuestion();
}

async function selectChoiceAction(questionId, choiceId) {
  const q = currentQuestions.find((item) => item.id === questionId);
  if (!q) return;

  q.selected_choice_id = choiceId;
  renderQuestionNav();
  showCurrentQuestion();

  // Gửi lưu tiến độ lên Server ngay lập tức (Autosave)
  try {
    await apiRequest(`/api/attempts/${currentAttempt.id}/answer`, {
      method: "POST",
      body: JSON.stringify({ question_id: questionId, selected_choice_id: choiceId }),
    });
  } catch (err) {
    if (err.message.includes("hết thời gian")) {
      alert("Đã hết giờ làm bài!");
      navigate("review", currentAttempt.id);
    }
  }
}

async function submitExamAction(isAuto = false) {
  if (!isAuto) {
    const unanswered = currentQuestions.filter((q) => !q.selected_choice_id).length;
    let msg = "Bạn có chắc chắn muốn nộp bài?";
    if (unanswered > 0) {
      msg = `Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay?`;
    }
    if (!confirm(msg)) return;
  }

  try {
    const res = await apiRequest(`/api/attempts/${currentAttempt.id}/submit`, { method: "POST" });
    if (timerInterval) clearInterval(timerInterval);
    alert(`Nộp bài thành công! Điểm số của bạn: ${res.score}/10 (${res.is_passed ? "ĐẠT" : "CHƯA ĐẠT"})`);
    navigate("review", currentAttempt.id);
  } catch (err) {
    alert("Lỗi khi nộp bài: " + err.message);
  }
}

// 5. Màn hình Xem Lại Kết Quả (Review)
async function renderReviewView(container, attemptId) {
  try {
    const res = await apiRequest(`/api/attempts/${attemptId}/review`);
    const att = res.attempt;
    const questions = res.questions;

    let html = `
      <div class="card">
        <div class="card-title">
          <h2>Kết Quả Lượt Thi: ${att.exam_title}</h2>
          <button class="btn btn-secondary" data-action="nav" data-param="history">Về Lịch Sử Thi</button>
        </div>

        <div style="background: #f1f5f9; padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div style="font-size: 0.875rem; color: var(--text-muted);">Điểm Số</div>
            <div style="font-size: 2rem; font-weight: 800; color: ${att.is_passed ? "var(--success)" : "var(--danger)"};">
              ${att.score} / 10
            </div>
          </div>
          <div>
            <div style="font-size: 0.875rem; color: var(--text-muted);">Kết Quả</div>
            <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.35rem; color: ${att.is_passed ? "var(--success)" : "var(--danger)"};">
              ${att.is_passed ? "ĐẠT" : "CHƯA ĐẠT"}
            </div>
          </div>
          <div>
            <div style="font-size: 0.875rem; color: var(--text-muted);">Số Câu Đúng</div>
            <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.35rem;">
              ${att.correct_count} / ${att.total_questions}
            </div>
          </div>
        </div>

        <h3>Chi Tiết Câu Hỏi & Đáp Án</h3>
    `;

    questions.forEach((q, idx) => {
      html += `
        <div style="border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; background: #fff;">
          <div style="font-weight: 600; margin-bottom: 0.5rem;">
            Câu ${idx + 1}: ${q.question_text}
            <span style="float: right; font-size: 0.875rem; color: ${q.is_correct ? "var(--success)" : "var(--danger)"};">
              ${q.is_correct ? "✓ Đúng" : "✗ Sai / Chưa chọn"}
            </span>
          </div>
          <div style="margin-left: 0.5rem;">
      `;

      q.choices.forEach((c) => {
        let cls = "choice-label";
        if (c.is_correct) cls += " correct";
        if (q.user_selected_choice_id === c.id && !c.is_correct) cls += " incorrect";

        html += `
          <div class="${cls}" style="cursor: default;">
            <span>${c.is_correct ? "● [Đáp án đúng] " : "○ "} ${c.choice_text} ${q.user_selected_choice_id === c.id ? "<strong>(Bạn đã chọn)</strong>" : ""}</span>
          </div>
        `;
      });

      if (q.explanation) {
        html += `<div style="font-size: 0.875rem; color: #475569; background: #f8fafc; padding: 0.5rem; border-radius: 0.375rem; margin-top: 0.5rem;">💡 <em>Giải thích:</em> ${q.explanation}</div>`;
      }

      html += `</div></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// 6. Màn hình Lịch Sử Thi Của Thí Sinh
async function renderHistoryView(container) {
  try {
    const res = await apiRequest("/api/attempts/my/history");
    const attempts = res.attempts || [];

    let html = `
      <div class="card">
        <h2 class="card-title">Lịch Sử Làm Bài Của Bạn</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); background: #f8fafc;">
                <th style="padding: 0.75rem;">Mã</th>
                <th style="padding: 0.75rem;">Tên Đề Thi</th>
                <th style="padding: 0.75rem;">Bắt Đầu</th>
                <th style="padding: 0.75rem;">Trạng Thái</th>
                <th style="padding: 0.75rem;">Điểm</th>
                <th style="padding: 0.75rem;">Kết Quả</th>
                <th style="padding: 0.75rem;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (attempts.length === 0) {
      html += `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Bạn chưa tham gia bài thi nào.</td></tr>`;
    } else {
      attempts.forEach((a) => {
        html += `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 0.75rem;">#${a.id}</td>
            <td style="padding: 0.75rem; font-weight: 600;">${a.exam_title}</td>
            <td style="padding: 0.75rem;">${a.started_at ? a.started_at.slice(0, 19).replace("T", " ") : ""}</td>
            <td style="padding: 0.75rem;">
              <span class="user-badge" style="background: ${a.status === "completed" ? "#dcfce7" : "#fee2e2"}; color: ${a.status === "completed" ? "#166534" : "#991b1b"};">
                ${a.status}
              </span>
            </td>
            <td style="padding: 0.75rem; font-weight: 700;">${a.score !== null ? a.score : "--"}</td>
            <td style="padding: 0.75rem; font-weight: 600; color: ${a.is_passed ? "var(--success)" : "var(--danger)"};">
              ${a.is_passed !== null ? (a.is_passed ? "ĐẠT" : "CHƯA ĐẠT") : "--"}
            </td>
            <td style="padding: 0.75rem;">
              ${a.status !== "in_progress" 
                ? `<button class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" data-action="nav" data-param="review" data-param2="${a.id}">Xem Lại</button>`
                : `<button class="btn btn-primary" style="padding: 0.25rem 0.5rem;" data-action="nav" data-param="quiz" data-param2="${a.id}">Tiếp Tục</button>`}
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// 7. Màn hình Quản Trị Đề Thi (Admin Only)
async function renderAdminView(container) {
  if (!currentUser || currentUser.role !== "admin") {
    return (container.innerHTML = `<div class="alert alert-error">Chỉ tài khoản Quản trị viên mới được phép truy cập.</div>`);
  }

  try {
    const [examRes, catRes] = await Promise.all([
      apiRequest("/api/exams"),
      apiRequest("/api/categories"),
    ]);

    const exams = examRes.exams || [];
    cachedCategories = catRes.categories || [];

    let html = `
      <div class="card">
        <div class="card-title">
          <h2>Quản Trị Đề Thi & Danh Mục</h2>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary" data-action="admin-manage-categories">⚙ Quản Lý Danh Mục</button>
            <button class="btn btn-primary" data-action="admin-create-exam">+ Tạo Đề Thi Mới</button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); background: #f8fafc;">
                <th style="padding: 0.75rem;">ID</th>
                <th style="padding: 0.75rem;">Tên Đề Thi</th>
                <th style="padding: 0.75rem;">Danh Mục</th>
                <th style="padding: 0.75rem;">Thời Lượng</th>
                <th style="padding: 0.75rem;">Điểm Đạt</th>
                <th style="padding: 0.75rem;">Trạng Thái</th>
                <th style="padding: 0.75rem;">Số Câu</th>
                <th style="padding: 0.75rem;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
    `;

    exams.forEach((e) => {
      html += `
        <tr style="border-bottom: 1px solid var(--border);" id="exam-row-${e.id}">
          <td style="padding: 0.75rem;">#${e.id}</td>
          <td style="padding: 0.75rem; font-weight: 600;">${escapeHtml(e.title)}</td>
          <td style="padding: 0.75rem;">
            <span class="category-badge">${escapeHtml(e.category_name || "Chưa phân loại")}</span>
          </td>
          <td style="padding: 0.75rem;">${e.duration_minutes} phút</td>
          <td style="padding: 0.75rem;">${parseFloat(e.passing_score).toFixed(1)}</td>
          <td style="padding: 0.75rem;">
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
              <select id="status-select-${e.id}" data-onchange="update-exam-status" data-param="${e.id}" data-original-status="${e.status}" style="padding: 0.25rem; border-radius: 0.25rem;">
                <option value="draft" ${e.status === "draft" ? "selected" : ""}>Nháp (draft)</option>
                <option value="published" ${e.status === "published" ? "selected" : ""}>Công bố (published)</option>
                <option value="closed" ${e.status === "closed" ? "selected" : ""}>Đóng (closed)</option>
              </select>
              <span id="unsaved-notice-${e.id}" style="display: none; font-size: 0.75rem; color: #b45309; background: #fef3c7; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-weight: 600;">
                ⚠️ Có thay đổi chưa lưu
              </span>
            </div>
          </td>
          <td style="padding: 0.75rem;">${e.question_count}</td>
          <td style="padding: 0.75rem; gap: 0.35rem; display: flex; align-items: center; flex-wrap: wrap;">
            <button id="save-btn-${e.id}" class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" disabled data-action="admin-save-exam-status" data-param="${e.id}" title="Lưu thay đổi trạng thái">Lưu thay đổi</button>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" data-action="admin-view-questions" data-param="${e.id}">Câu Hỏi</button>
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" data-action="admin-view-results" data-param="${e.id}">Kết Quả</button>
            <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" data-action="admin-delete-exam" data-param="${e.id}" data-param2="${escapeHtml(e.title)}" title="Xóa đề (Chuyển vào thùng rác)">
              🗑 Xóa
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div></div><div id="admin-sub-view"></div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

// Modal tạo đề thi (chọn Danh mục)
async function showCreateExamModal() {
  const title = prompt("Nhập tiêu đề đề thi:");
  if (!title) return;
  const description = prompt("Nhập mô tả đề thi (tùy chọn):", "");
  
  let catPrompt = "Chọn ID danh mục:\n0: Chưa phân loại\n";
  cachedCategories.forEach((c) => {
    catPrompt += `${c.id}: ${c.name}\n`;
  });
  const catChoice = prompt(catPrompt, "1");
  const catId = parseInt(catChoice, 10) || 0;

  const duration = prompt("Nhập thời lượng làm bài (phút):", "15");
  if (!duration) return;
  const passing = prompt("Nhập điểm đạt (thang 10):", "5.0");

  try {
    await apiRequest("/api/exams", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        category_id: catId > 0 ? catId : null,
        duration_minutes: parseInt(duration, 10),
        passing_score: parseFloat(passing),
        status: "draft",
      }),
    });
    alert("Tạo đề thi thành công!");
    renderAdminView(document.getElementById("app"));
  } catch (err) {
    alert("Lỗi tạo đề thi: " + err.message);
  }
}

// Quản lý Danh mục (Admin)
async function showManageCategoriesModal() {
  const subView = document.getElementById("admin-sub-view");
  if (!subView) return;

  try {
    const res = await apiRequest("/api/categories");
    const cats = res.categories || [];

    let html = `
      <div class="card" style="margin-top: 1.5rem; border-top: 3px solid #6366f1;">
        <div class="card-title">
          <h3>Quản Lý Danh Mục Bài Thi (${cats.length} danh mục)</h3>
          <button class="btn btn-primary" id="btn-add-cat-form">+ Thêm Danh Mục Mới</button>
        </div>

        <div id="cat-create-box" style="display: none; background: #f8fafc; border: 1px solid var(--border); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
          <h4 style="margin-bottom: 0.5rem;">Thêm Danh Mục</h4>
          <div class="form-group">
            <label>Tên danh mục:</label>
            <input type="text" id="new-cat-name" class="form-control" placeholder="VD: Điện toán Đám mây">
          </div>
          <div class="form-group">
            <label>Mô tả:</label>
            <input type="text" id="new-cat-desc" class="form-control" placeholder="Mô tả danh mục...">
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-success" id="btn-submit-cat">Lưu Danh Mục</button>
            <button class="btn btn-secondary" id="btn-cancel-cat">Hủy</button>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border); background: #f8fafc;">
              <th style="padding: 0.5rem;">ID</th>
              <th style="padding: 0.5rem;">Tên Danh Mục</th>
              <th style="padding: 0.5rem;">Slug</th>
              <th style="padding: 0.5rem;">Mô Tả</th>
              <th style="padding: 0.5rem;">Số Đề Thi</th>
              <th style="padding: 0.5rem;">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
    `;

    cats.forEach((c) => {
      html += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 0.5rem;">#${c.id}</td>
          <td style="padding: 0.5rem; font-weight: 600;">${c.name}</td>
          <td style="padding: 0.5rem; color: #64748b;">${c.slug}</td>
          <td style="padding: 0.5rem;">${c.description || "--"}</td>
          <td style="padding: 0.5rem;">
            <span class="user-badge">${c.total_exam_count} bài (${c.published_exam_count} published)</span>
          </td>
          <td style="padding: 0.5rem;">
            <button class="btn btn-danger" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" data-del-cat="${c.id}" data-cat-name="${c.name}">Xóa</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    subView.innerHTML = html;

    // Attach local listeners cho modal quản lý category
    const addBtn = document.getElementById("btn-add-cat-form");
    const box = document.getElementById("cat-create-box");
    const cancelBtn = document.getElementById("btn-cancel-cat");
    const submitBtn = document.getElementById("btn-submit-cat");

    if (addBtn && box) addBtn.addEventListener("click", () => box.style.display = "block");
    if (cancelBtn && box) cancelBtn.addEventListener("click", () => box.style.display = "none");
    if (submitBtn) {
      submitBtn.addEventListener("click", async () => {
        const name = document.getElementById("new-cat-name").value.trim();
        const desc = document.getElementById("new-cat-desc").value.trim();
        if (!name) return alert("Vui lòng nhập tên danh mục.");
        try {
          await apiRequest("/api/categories", {
            method: "POST",
            body: JSON.stringify({ name, description: desc }),
          });
          alert("Thêm danh mục thành công!");
          showManageCategoriesModal();
        } catch (err) {
          alert("Lỗi: " + err.message);
        }
      });
    }

    // Attach click listener xóa danh mục
    subView.querySelectorAll("[data-del-cat]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const catId = btn.getAttribute("data-del-cat");
        const catName = btn.getAttribute("data-cat-name");
        if (!confirm(`Bạn có chắc muốn xóa danh mục "${catName}"?`)) return;
        try {
          const res = await apiRequest(`/api/categories/${catId}`, { method: "DELETE" });
          alert(res.message);
          showManageCategoriesModal();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    alert("Lỗi tải danh mục: " + err.message);
  }
}

// Lưu thay đổi trạng thái đề thi (Action của nút "Lưu thay đổi")
async function saveExamStatusAction(examId) {
  const selectEl = document.getElementById(`status-select-${examId}`);
  const saveBtn = document.getElementById(`save-btn-${examId}`);
  const noticeEl = document.getElementById(`unsaved-notice-${examId}`);

  if (!selectEl) return;
  const newStatus = selectEl.value;

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";
  }

  try {
    const detailRes = await apiRequest(`/api/exams/${examId}`);
    const exam = detailRes.exam;

    const res = await apiRequest(`/api/exams/${examId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: exam.title,
        description: exam.description,
        category_id: exam.category_id,
        duration_minutes: exam.duration_minutes,
        passing_score: exam.passing_score,
        status: newStatus,
      }),
    });

    selectEl.setAttribute("data-original-status", newStatus);
    if (noticeEl) noticeEl.style.display = "none";
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.className = "btn btn-secondary";
      saveBtn.textContent = "Lưu thay đổi";
    }
    alert(res.message || "Lưu thay đổi thành công!");
  } catch (err) {
    alert("Không thể lưu: " + err.message);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu thay đổi";
    }
  }
}

// Xóa đề thi (Chuyển vào Thùng rác - Soft Delete)
async function deleteExamAction(examId, examTitle) {
  const titleDisplay = examTitle || `#${examId}`;
  if (!confirm(`Bạn có chắc chắn muốn xóa đề thi "${titleDisplay}"?\nĐề thi sẽ được chuyển vào Thùng rác và có thể khôi phục bất cứ lúc nào.`)) {
    return;
  }

  try {
    const res = await apiRequest(`/api/exams/${examId}`, { method: "DELETE" });
    alert(res.message || "Đã chuyển đề thi vào Thùng rác.");
    renderAdminView(document.getElementById("app"));
  } catch (err) {
    alert("Lỗi xóa đề thi: " + err.message);
  }
}

// Khôi phục đề thi từ Thùng rác về Nháp
async function restoreExamAction(examId, examTitle) {
  const titleDisplay = examTitle || `#${examId}`;
  if (!confirm(`Khôi phục đề thi "${titleDisplay}" về trạng thái Nháp (draft)?`)) {
    return;
  }

  try {
    const res = await apiRequest(`/api/exams/${examId}/restore`, { method: "POST" });
    alert(res.message || "Đã khôi phục đề thi thành công.");
    renderAdminTrashView(document.getElementById("app"));
  } catch (err) {
    alert("Lỗi khôi phục: " + err.message);
  }
}

// Giao diện Thùng Rác (Admin Trash View)
async function renderAdminTrashView(container) {
  if (!currentUser || currentUser.role !== "admin") {
    return (container.innerHTML = `<div class="alert alert-error">Chỉ Quản trị viên mới được truy cập Thùng rác.</div>`);
  }

  try {
    const res = await apiRequest("/api/exams/trash");
    const exams = res.exams || [];

    let html = `
      <div class="card">
        <div class="card-title">
          <h2>🗑 Thùng Rác Đề Thi (${exams.length} đề đã xóa)</h2>
          <button class="btn btn-secondary" data-action="nav" data-param="admin">Quay Lại Quản Lý Đề</button>
        </div>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">
          Các đề thi trong Thùng rác bị ẩn khỏi danh sách thí sinh và không nhận lượt thi mới. Toàn bộ lịch sử làm bài trước đây vẫn được bảo toàn nguyên vẹn.
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); background: #f8fafc;">
                <th style="padding: 0.75rem;">ID</th>
                <th style="padding: 0.75rem;">Tên Đề Thi</th>
                <th style="padding: 0.75rem;">Danh Mục</th>
                <th style="padding: 0.75rem;">Số Câu</th>
                <th style="padding: 0.75rem;">Thời Điểm Xóa</th>
                <th style="padding: 0.75rem;">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (exams.length === 0) {
      html += `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Thùng rác hiện đang trống.</td></tr>`;
    } else {
      exams.forEach((e) => {
        html += `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 0.75rem;">#${e.id}</td>
            <td style="padding: 0.75rem; font-weight: 600;">${escapeHtml(e.title)}</td>
            <td style="padding: 0.75rem;"><span class="category-badge">${escapeHtml(e.category_name || "Chưa phân loại")}</span></td>
            <td style="padding: 0.75rem;">${e.question_count}</td>
            <td style="padding: 0.75rem; color: var(--text-muted);">${e.deleted_at ? e.deleted_at.slice(0, 19).replace("T", " ") : "--"}</td>
            <td style="padding: 0.75rem;">
              <button class="btn btn-success" style="padding: 0.25rem 0.6rem;" data-action="admin-restore-exam" data-param="${e.id}" data-param2="${escapeHtml(e.title)}" title="Khôi phục về trạng thái Nháp">
                ↺ Khôi Phục
              </button>
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Lỗi tải Thùng rác: ${escapeHtml(err.message)}</div>`;
  }
}

// Polling timer cho Loki logs
let lokiPollingInterval = null;

// Giao diện Nhật Ký Hệ Thống (System Logs View: Audit Logs & Loki Logs)
async function renderAdminLogsView(container) {
  if (!currentUser || currentUser.role !== "admin") {
    return (container.innerHTML = `<div class="alert alert-error">Chỉ Quản trị viên mới được truy cập Nhật ký hệ thống.</div>`);
  }

  // Dừng polling cũ nếu có
  if (lokiPollingInterval) {
    clearInterval(lokiPollingInterval);
    lokiPollingInterval = null;
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        <h2>📋 Nhật Ký Hệ Thống</h2>
        <button class="btn btn-secondary" data-action="nav" data-param="admin">Quay Lại Quản Lý Đề</button>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
        <button id="tab-audit-btn" class="btn btn-primary" style="padding: 0.4rem 1rem;">1. Nhật Ký Hoạt Động (Audit Logs)</button>
        <button id="tab-loki-btn" class="btn btn-secondary" style="padding: 0.4rem 1rem;">2. Nhật Ký Kỹ Thuật (Loki Centralized Logs)</button>
      </div>

      <!-- Section A: Audit Logs -->
      <div id="section-audit">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: center; background: #f8fafc; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border);">
          <div>
            <label style="font-size: 0.75rem; font-weight: 600;">Hành động:</label>
            <select id="audit-filter-action" class="form-control" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
              <option value="">-- Tất cả hành động --</option>
              <option value="CREATE_EXAM">Tạo đề thi (CREATE_EXAM)</option>
              <option value="UPDATE_EXAM">Cập nhật đề thi (UPDATE_EXAM)</option>
              <option value="SOFT_DELETE_EXAM">Xóa đề thi (SOFT_DELETE_EXAM)</option>
              <option value="RESTORE_EXAM">Khôi phục đề thi (RESTORE_EXAM)</option>
              <option value="CREATE_CATEGORY">Tạo danh mục</option>
              <option value="UPDATE_CATEGORY">Sửa danh mục</option>
              <option value="DELETE_CATEGORY">Xóa danh mục</option>
              <option value="ADD_QUESTION">Thêm câu hỏi</option>
              <option value="DELETE_QUESTION">Xóa câu hỏi</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600;">Trạng thái:</label>
            <select id="audit-filter-status" class="form-control" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
              <option value="">-- Tất cả --</option>
              <option value="success">Thành công (success)</option>
              <option value="failure">Thất bại (failure)</option>
            </select>
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 0.75rem; font-weight: 600;">Tìm kiếm chi tiết/User:</label>
            <input type="text" id="audit-filter-search" class="form-control" placeholder="Từ khóa..." style="padding: 0.25rem 0.5rem; font-size: 0.8125rem;">
          </div>
          <div style="align-self: flex-end;">
            <button class="btn btn-primary" data-action="admin-refresh-audit" style="padding: 0.35rem 0.75rem; font-size: 0.8125rem;">Lọc / Làm mới</button>
          </div>
        </div>

        <div id="audit-logs-container" style="overflow-x: auto;">
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">Đang tải nhật ký hoạt động...</div>
        </div>
      </div>

      <!-- Section B: Loki Logs -->
      <div id="section-loki" style="display: none;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: center; background: #0f172a; color: #f8fafc; padding: 0.75rem; border-radius: 0.5rem;">
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: #94a3b8;">Dịch vụ:</label>
            <select id="loki-filter-service" class="form-control" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem; background: #1e293b; color: #fff; border-color: #334155;">
              <option value="all">Tất cả (app + nginx)</option>
              <option value="app">quiz-app (Node.js)</option>
              <option value="nginx">nginx (Reverse Proxy)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; font-weight: 600; color: #94a3b8;">Mức lọc:</label>
            <select id="loki-filter-level" class="form-control" style="padding: 0.25rem 0.5rem; font-size: 0.8125rem; background: #1e293b; color: #fff; border-color: #334155;">
              <option value="all">Tất cả các dòng</option>
              <option value="error">Mã lỗi >= 400 (4xx và 5xx)</option>
              <option value="5xx">Lỗi máy chủ (>= 500)</option>
              <option value="4xx">Lỗi client (400 - 499)</option>
            </select>
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 0.75rem; font-weight: 600; color: #94a3b8;">Tìm kiếm từ khóa:</label>
            <input type="text" id="loki-filter-search" class="form-control" placeholder="Từ khóa..." style="padding: 0.25rem 0.5rem; font-size: 0.8125rem; background: #1e293b; color: #fff; border-color: #334155;">
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center; align-self: flex-end;">
            <button class="btn btn-primary" data-action="admin-refresh-loki" style="padding: 0.35rem 0.75rem; font-size: 0.8125rem;">Làm mới</button>
            <label style="font-size: 0.8125rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer; color: #cbd5e1;">
              <input type="checkbox" id="loki-auto-refresh"> Tự cập nhật (7s)
            </label>
          </div>
        </div>

        <div id="loki-query-badge" style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-muted); font-family: monospace;"></div>
        <div id="loki-logs-container" style="background: #020617; color: #e2e8f0; font-family: 'Courier New', Courier, monospace; font-size: 0.8125rem; padding: 1rem; border-radius: 0.5rem; max-height: 500px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">
          Đang truy vấn Loki...
        </div>
      </div>
    </div>
  `;

  // Gắn event chuyển tab
  const tabAudit = document.getElementById("tab-audit-btn");
  const tabLoki = document.getElementById("tab-loki-btn");
  const secAudit = document.getElementById("section-audit");
  const secLoki = document.getElementById("section-loki");

  if (tabAudit && tabLoki) {
    tabAudit.addEventListener("click", () => {
      tabAudit.className = "btn btn-primary";
      tabLoki.className = "btn btn-secondary";
      secAudit.style.display = "block";
      secLoki.style.display = "none";
      if (lokiPollingInterval) {
        clearInterval(lokiPollingInterval);
        lokiPollingInterval = null;
        const chk = document.getElementById("loki-auto-refresh");
        if (chk) chk.checked = false;
      }
    });

    tabLoki.addEventListener("click", () => {
      tabLoki.className = "btn btn-primary";
      tabAudit.className = "btn btn-secondary";
      secAudit.style.display = "none";
      secLoki.style.display = "block";
      loadLokiLogs();
    });
  }

  // Auto-refresh checkbox
  const autoChk = document.getElementById("loki-auto-refresh");
  if (autoChk) {
    autoChk.addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!lokiPollingInterval) {
          lokiPollingInterval = setInterval(() => {
            loadLokiLogs(true);
          }, 7000);
        }
      } else {
        if (lokiPollingInterval) {
          clearInterval(lokiPollingInterval);
          lokiPollingInterval = null;
        }
      }
    });
  }

  // Load audit logs mặc định
  await loadAuditLogs();
}

// Tải dữ liệu Audit Logs
async function loadAuditLogs() {
  const container = document.getElementById("audit-logs-container");
  if (!container) return;

  const action = document.getElementById("audit-filter-action")?.value || "";
  const status = document.getElementById("audit-filter-status")?.value || "";
  const search = document.getElementById("audit-filter-search")?.value || "";

  const queryParams = new URLSearchParams();
  if (action) queryParams.append("action", action);
  if (status) queryParams.append("status", status);
  if (search) queryParams.append("search", search);
  queryParams.append("limit", "50");

  try {
    const res = await apiRequest(`/api/logs/audit?${queryParams.toString()}`);
    const logs = res.logs || [];

    if (logs.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Không tìm thấy bản ghi nhật ký hoạt động nào.</div>`;
      return;
    }

    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.8125rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border); background: #f8fafc;">
            <th style="padding: 0.5rem;">Thời gian</th>
            <th style="padding: 0.5rem;">Người thực hiện</th>
            <th style="padding: 0.5rem;">Hành động</th>
            <th style="padding: 0.5rem;">Đối tượng</th>
            <th style="padding: 0.5rem;">Chi tiết</th>
            <th style="padding: 0.5rem;">Kết quả</th>
            <th style="padding: 0.5rem;">IP Client</th>
          </tr>
        </thead>
        <tbody>
    `;

    logs.forEach((l) => {
      const timeStr = l.created_at ? l.created_at.slice(0, 19).replace("T", " ") : "--";
      const statusBadge = l.status === "success" 
        ? `<span style="color: #166534; background: #dcfce7; padding: 0.1rem 0.4rem; border-radius: 9999px; font-weight: 600;">thành công</span>`
        : `<span style="color: #991b1b; background: #fee2e2; padding: 0.1rem 0.4rem; border-radius: 9999px; font-weight: 600;">thất bại</span>`;

      html += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 0.5rem; white-space: nowrap; color: var(--text-muted);">${timeStr}</td>
          <td style="padding: 0.5rem; font-weight: 600;">${escapeHtml(l.username || "Hệ thống")} (${escapeHtml(l.role || "--")})</td>
          <td style="padding: 0.5rem; font-family: monospace; font-weight: 600; color: #4338ca;">${escapeHtml(l.action)}</td>
          <td style="padding: 0.5rem;">${escapeHtml(l.entity_type)} #${escapeHtml(l.entity_id || "")}</td>
          <td style="padding: 0.5rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(l.details || "")}">${escapeHtml(l.details || "--")}</td>
          <td style="padding: 0.5rem;">${statusBadge}</td>
          <td style="padding: 0.5rem; color: var(--text-muted); font-family: monospace;">${escapeHtml(l.ip_address || "--")}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Lỗi tải nhật ký: ${escapeHtml(err.message)}</div>`;
  }
}

// Tải dữ liệu Loki Logs (Render text an toàn bằng textContent)
async function loadLokiLogs(isSilent = false) {
  const container = document.getElementById("loki-logs-container");
  const badge = document.getElementById("loki-query-badge");
  if (!container) return;

  if (!isSilent) {
    container.textContent = "Đang truy vấn log từ máy chủ Loki...";
  }

  const service = document.getElementById("loki-filter-service")?.value || "all";
  const level = document.getElementById("loki-filter-level")?.value || "all";
  const search = document.getElementById("loki-filter-search")?.value || "";

  const queryParams = new URLSearchParams();
  if (service !== "all") queryParams.append("service", service);
  if (level !== "all") queryParams.append("level", level);
  if (search) queryParams.append("search", search);
  queryParams.append("limit", "100");

  try {
    const res = await apiRequest(`/api/logs/loki?${queryParams.toString()}`);
    if (badge && res.queryUsed) {
      badge.textContent = `LogQL áp dụng: ${res.queryUsed} (Tổng nhận: ${res.total || 0} dòng)`;
    }

    if (!res.available) {
      container.textContent = `[THÔNG BÁO] ${res.message}`;
      return;
    }

    const logs = res.logs || [];
    if (logs.length === 0) {
      container.textContent = "Không tìm thấy dòng log nào khớp với bộ lọc.";
      return;
    }

    // Nối văn bản an toàn, dùng textContent tuyệt đối không dùng innerHTML
    const textLines = logs.map((l) => `[${l.timestamp}] [${l.service.toUpperCase()}] ${l.line}`);
    container.textContent = textLines.join("\n");
  } catch (err) {
    container.textContent = `[LỖI TRUY VẤN] ${err.message}`;
  }
}


// Xem & Thêm câu hỏi cho đề thi (Admin)
async function viewExamQuestions(examId) {
  const subView = document.getElementById("admin-sub-view");
  if (!subView) return;

  try {
    const res = await apiRequest(`/api/exams/${examId}`);
    const exam = res.exam;
    const questions = res.questions || [];

    let html = `
      <div class="card" style="margin-top: 1.5rem; border-top: 3px solid var(--primary);">
        <div class="card-title">
          <h3>Quản lý Câu hỏi: ${exam.title} (${questions.length} câu)</h3>
          <button class="btn btn-primary" data-action="admin-show-add-q" data-param="${exam.id}">+ Thêm Câu Hỏi Mới</button>
        </div>
        <div id="add-q-form-box" style="display: none; margin-bottom: 1.5rem;"></div>
    `;

    questions.forEach((q, idx) => {
      html += `
        <div style="border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem; background: #fff;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 0.5rem;">
            <span>Câu ${idx + 1}: ${q.question_text}</span>
            <button class="btn btn-danger" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" data-action="admin-delete-q" data-param="${exam.id}" data-param2="${q.id}">Xóa</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.875rem;">
      `;

      q.choices.forEach((c) => {
        html += `
          <div style="padding: 0.5rem; border-radius: 0.25rem; background: ${c.is_correct ? "#dcfce7" : "#f8fafc"}; border: 1px solid ${c.is_correct ? "#86efac" : "#e2e8f0"};">
            ${c.is_correct ? "<strong>[Đúng]</strong> " : ""}${c.choice_text}
          </div>
        `;
      });

      html += `</div></div>`;
    });

    html += `</div>`;
    subView.innerHTML = html;
  } catch (err) {
    alert(err.message);
  }
}

// Form thêm câu hỏi với đúng 4 lựa chọn và 1 đáp án đúng
function showAddQuestionForm(examId) {
  const box = document.getElementById("add-q-form-box");
  if (!box) return;

  box.style.display = "block";
  box.innerHTML = `
    <div style="background: #f8fafc; border: 1px solid var(--border); padding: 1rem; border-radius: 0.5rem;">
      <h4 style="margin-bottom: 0.75rem;">Thêm Câu Hỏi (4 Lựa chọn - Chọn 1 Đáp Án Đúng)</h4>
      <div class="form-group">
        <label>Nội dung câu hỏi:</label>
        <textarea id="new-q-text" class="form-control" rows="2" required placeholder="Nhập câu hỏi..."></textarea>
      </div>
      <div class="form-group">
        <label>Giải thích chi tiết (nếu có):</label>
        <input type="text" id="new-q-exp" class="form-control" placeholder="Giải thích đáp án...">
      </div>

      <div style="margin-bottom: 1rem;">
        <label style="font-weight: 600; font-size: 0.875rem;">4 Lựa chọn (Đánh dấu radio vào câu đúng):</label>
        <div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="correct_choice" value="0" checked>
            <input type="text" id="choice_0" class="form-control" placeholder="Đáp án A" required>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="correct_choice" value="1">
            <input type="text" id="choice_1" class="form-control" placeholder="Đáp án B" required>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="correct_choice" value="2">
            <input type="text" id="choice_2" class="form-control" placeholder="Đáp án C" required>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="correct_choice" value="3">
            <input type="text" id="choice_3" class="form-control" placeholder="Đáp án D" required>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-success" data-action="admin-submit-q" data-param="${examId}">Lưu Câu Hỏi</button>
        <button class="btn btn-secondary" data-action="admin-hide-add-q">Hủy</button>
      </div>
    </div>
  `;
}

async function submitNewQuestion(examId) {
  const text = document.getElementById("new-q-text").value.trim();
  const exp = document.getElementById("new-q-exp").value.trim();
  const c0 = document.getElementById("choice_0").value.trim();
  const c1 = document.getElementById("choice_1").value.trim();
  const c2 = document.getElementById("choice_2").value.trim();
  const c3 = document.getElementById("choice_3").value.trim();

  const checkedRadio = document.querySelector('input[name="correct_choice"]:checked');
  if (!checkedRadio) return alert("Vui lòng đánh dấu 1 đáp án đúng.");
  const correctIndex = parseInt(checkedRadio.value, 10);

  if (!text || !c0 || !c1 || !c2 || !c3) {
    return alert("Vui lòng nhập đầy đủ câu hỏi và 4 lựa chọn.");
  }

  const choices = [
    { choice_text: c0, is_correct: correctIndex === 0 },
    { choice_text: c1, is_correct: correctIndex === 1 },
    { choice_text: c2, is_correct: correctIndex === 2 },
    { choice_text: c3, is_correct: correctIndex === 3 },
  ];

  try {
    await apiRequest(`/api/exams/${examId}/questions`, {
      method: "POST",
      body: JSON.stringify({ question_text: text, explanation: exp, choices }),
    });
    alert("Thêm câu hỏi thành công!");
    viewExamQuestions(examId);
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
}

async function deleteQuestionAction(examId, questionId) {
  if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
  try {
    await apiRequest(`/api/exams/questions/${questionId}`, { method: "DELETE" });
    viewExamQuestions(examId);
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
}

// Xem kết quả các lượt thi của đề (Admin)
async function viewExamResultsAdmin(examId) {
  const subView = document.getElementById("admin-sub-view");
  if (!subView) return;

  try {
    const res = await apiRequest(`/api/exams/${examId}/results`);
    const attempts = res.attempts || [];

    let html = `
      <div class="card" style="margin-top: 1.5rem;">
        <h3>Danh Sách Lượt Thi Của Đề #${examId} (${attempts.length} lượt)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-top: 1rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border); background: #f8fafc;">
              <th style="padding: 0.5rem;">Mã</th>
              <th style="padding: 0.5rem;">Thí Sinh</th>
              <th style="padding: 0.5rem;">Email</th>
              <th style="padding: 0.5rem;">Bắt Đầu</th>
              <th style="padding: 0.5rem;">Trạng Thái</th>
              <th style="padding: 0.5rem;">Điểm</th>
              <th style="padding: 0.5rem;">Kết Quả</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (attempts.length === 0) {
      html += `<tr><td colspan="7" style="text-align: center; padding: 1.5rem;">Chưa có lượt thi nào.</td></tr>`;
    } else {
      attempts.forEach((a) => {
        html += `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 0.5rem;">#${a.id}</td>
            <td style="padding: 0.5rem; font-weight: 600;">${a.full_name}</td>
            <td style="padding: 0.5rem;">${a.email}</td>
            <td style="padding: 0.5rem;">${a.started_at ? a.started_at.slice(0, 19).replace("T", " ") : ""}</td>
            <td style="padding: 0.5rem;">${a.status}</td>
            <td style="padding: 0.5rem; font-weight: 700;">${a.score !== null ? a.score : "--"}</td>
            <td style="padding: 0.5rem; color: ${a.is_passed ? "var(--success)" : "var(--danger)"}; font-weight: 600;">
              ${a.is_passed !== null ? (a.is_passed ? "ĐẠT" : "CHƯA ĐẠT") : "--"}
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div>`;
    subView.innerHTML = html;
  } catch (err) {
    alert(err.message);
  }
}
