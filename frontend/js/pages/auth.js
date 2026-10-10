/**
 * LUXURY AUTHENTICATION PAGE CONTROLLER (Login & Register)
 * Split-screen luxury layout, Password show/hide toggle, Real-time strength meter,
 * Interactive Canvas Captcha, Quick Demo logins, Social buttons & JWT storage.
 */

const authPage = {
    activeTab: 'login',
    captchaInstance: null,

    render(container) {
        container.innerHTML = `
            <div class="container py-6">
                <!-- Breadcrumbs -->
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">${this.activeTab === 'login' ? 'Đăng Nhập' : (this.activeTab === 'register' ? 'Đăng Ký Tài Khoản' : (this.activeTab === 'forgot-password' ? 'Quên Mật Khẩu' : 'Đặt Lại Mật Khẩu'))}</span>
                </div>

                <!-- Main Luxury Split Layout -->
                <div class="auth-split-wrapper">
                    <!-- Left Column: Branding, 3D Showcase & Benefits -->
                    <div class="auth-banner-panel">
                        <div>
                            <!-- Brand Header -->
                            <div class="d-flex items-center gap-3 mb-6">
                                <div class="logo-icon" style="width: 44px; height: 44px; font-size: 1.25rem; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                                    <i class="fa-solid fa-book-bookmark"></i>
                                </div>
                                <div>
                                    <div class="text-xl font-extrabold text-white">Book<span style="color: #fef08a;">Nest</span></div>
                                    <div class="text-xs" style="color: #cbd5e1;">Thế Giới Tri Thức & Gợi Ý Thông Minh</div>
                                </div>
                            </div>

                            <h2 class="text-2xl font-extrabold text-white mb-3" style="line-height: 1.3;">
                                Mở Cửa Vũ Trụ Tri Thức <br><span style="color: #fef08a;">Dành Riêng Cho Bạn</span>
                            </h2>
                            <p class="text-sm mb-6" style="color: #e0e7ff; line-height: 1.6;">
                                Đăng nhập để nhận gợi ý sách thông minh theo 5 sở thích, tích điểm đổi quà và thanh toán VietQR một chạm siêu tốc.
                            </p>

                            <!-- Feature Benefits List -->
                            <div class="auth-benefit-item">
                                <div class="auth-benefit-icon" style="background: rgba(236, 72, 153, 0.25); color: #f472b6;">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                                </div>
                                <div class="text-xs">
                                    <strong class="text-white d-block font-bold">Gợi Ý Sách Cá Nhân Hóa (AI)</strong>
                                    <span style="color: #cbd5e1;">Thuật toán đề xuất theo đúng 5 thể loại yêu thích</span>
                                </div>
                            </div>

                            <div class="auth-benefit-item">
                                <div class="auth-benefit-icon" style="background: rgba(16, 185, 129, 0.25); color: #34d399;">
                                    <i class="fa-solid fa-gift"></i>
                                </div>
                                <div class="text-xs">
                                    <strong class="text-white d-block font-bold">Ưu Đãi Hội Viên Độc Quyền</strong>
                                    <span style="color: #cbd5e1;">Nhập mã <strong>BOOK20</strong> giảm 20K & FreeShip toàn quốc</span>
                                </div>
                            </div>

                            <div class="auth-benefit-item">
                                <div class="auth-benefit-icon" style="background: rgba(59, 130, 246, 0.25); color: #60a5fa;">
                                    <i class="fa-solid fa-qrcode"></i>
                                </div>
                                <div class="text-xs">
                                    <strong class="text-white d-block font-bold">Thanh Toán VietQR 24/7</strong>
                                    <span style="color: #cbd5e1;">Quét mã chuyển khoản tự động không cần nhập STK</span>
                                </div>
                            </div>
                        </div>

                        <!-- Footer Quote in Left Banner -->
                        <div class="pt-6 mt-4" style="border-top: 1px solid rgba(255, 255, 255, 0.15);">
                            <p class="text-xs italic" style="color: #fef08a;">
                                <i class="fa-solid fa-quote-left mr-1"></i> "Đọc sách là cách bạn du hành xuyên không gian và trò chuyện cùng những bộ óc vĩ đại nhất."
                            </p>
                        </div>
                    </div>

                    <!-- Right Column: Interactive Form -->
                    <div class="auth-form-panel">
                        <!-- Segmented Pill Switcher -->
                        <div class="auth-pill-switcher ${['login', 'register'].includes(this.activeTab) ? '' : 'd-none'}">
                            <button class="auth-pill-btn ${this.activeTab === 'login' ? 'active' : ''}" onclick="authPage.switchTab('login')">
                                <i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng Nhập
                            </button>
                            <button class="auth-pill-btn ${this.activeTab === 'register' ? 'active' : ''}" onclick="authPage.switchTab('register')">
                                <i class="fa-solid fa-user-plus"></i> Đăng Ký Tài Khoản
                            </button>
                        </div>

                        <!-- Header Greeting -->
                        <div class="mb-4">
                            <h3 class="text-2xl font-bold mb-1">
                                ${this.activeTab === 'login' ? 'Chào Mừng Trở Lại! 👋' : (this.activeTab === 'register' ? 'Tạo Tài Khoản Mới ✨' : (this.activeTab === 'forgot-password' ? 'Khôi Phục Mật Khẩu 🔑' : 'Tạo Mật Khẩu Mới 🔒'))}
                            </h3>
                            <p class="text-xs text-muted">
                                ${this.activeTab === 'login' ? 'Vui lòng nhập thông tin tài khoản của bạn để tiếp tục' : (this.activeTab === 'register' ? 'Chỉ mất 30 giây để bắt đầu hành trình đọc sách tuyệt vời' : (this.activeTab === 'forgot-password' ? 'Nhập email của bạn để nhận mã khôi phục' : 'Vui lòng đặt mật khẩu mới cho tài khoản của bạn'))}
                            </p>
                        </div>

                        <!-- Quick Demo Account Chips -->
                        <div class="p-3 mb-4 rounded-lg" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                            <div class="d-flex items-center justify-between flex-wrap gap-2">
                                <span class="text-xs font-bold text-muted"><i class="fa-solid fa-bolt text-accent mr-1"></i> Đăng nhập mẫu nhanh:</span>
                                <div class="d-flex gap-2">
                                    <button class="demo-account-chip demo-chip-user" onclick="authPage.fillDemo('quang@booknest.vn', '123456')">
                                        <i class="fa-solid fa-user"></i> Khách hàng (Quang)
                                    </button>
                                    <button class="demo-account-chip demo-chip-admin" onclick="authPage.fillDemo('admin@booknest.vn', 'admin123')">
                                        <i class="fa-solid fa-shield-halved"></i> Quản trị (Minh Anh)
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Form: Login -->
                        <form id="login-form" class="${this.activeTab === 'login' ? '' : 'd-none'}" onsubmit="authPage.handleLogin(event)">
                            <div class="form-group">
                                <label class="form-label">Email tài khoản <span class="required-mark">*</span></label>
                                <div class="input-with-icon">
                                    <i class="fa-regular fa-envelope input-icon"></i>
                                    <input type="email" id="login-email" class="form-input" placeholder="nhapemail@domain.com" required value="quang@booknest.vn">
                                </div>
                                <div class="form-feedback d-none" id="err-login-email"></div>
                            </div>

                            <div class="form-group">
                                <div class="d-flex justify-between items-center mb-1">
                                    <label class="form-label mb-0">Mật khẩu <span class="required-mark">*</span></label>
                                    <a href="javascript:void(0)" class="text-xs text-primary font-semibold hover-underline" onclick="authPage.switchTab('forgot-password')">Quên mật khẩu?</a>
                                </div>
                                <div class="password-input-wrap input-with-icon">
                                    <i class="fa-solid fa-lock input-icon"></i>
                                    <input type="password" id="login-password" class="form-input" placeholder="Nhập mật khẩu..." required value="123456">
                                    <button type="button" class="password-toggle-btn" onclick="authPage.togglePasswordVisibility('login-password', this)">
                                        <i class="fa-regular fa-eye"></i>
                                    </button>
                                </div>
                                <div class="form-feedback d-none" id="err-login-password"></div>
                            </div>

                            <!-- Captcha Row for Login -->
                            <div class="form-group">
                                <label class="form-label">Mã xác thực bảo vệ (Captcha) <span class="required-mark">*</span></label>
                                <div class="captcha-container">
                                    <div class="captcha-canvas-box">
                                        <canvas id="login-captcha-canvas" width="140" height="44" class="captcha-canvas"></canvas>
                                    </div>
                                    <button type="button" class="captcha-refresh-btn" title="Đổi mã khác" onclick="authPage.refreshCaptcha()">
                                        <i class="fa-solid fa-arrows-rotate"></i>
                                    </button>
                                    <input type="text" id="login-captcha-input" class="form-input text-uppercase font-bold" placeholder="Nhập mã..." maxlength="6" style="width: 140px;" required>
                                </div>
                                <div class="form-feedback d-none" id="err-login-captcha">Mã captcha không chính xác!</div>
                            </div>

                            <div class="d-flex items-center justify-between mb-4 text-xs">
                                <label class="form-checkbox-label">
                                    <input type="checkbox" checked> Ghi nhớ đăng nhập trên thiết bị này
                                </label>
                            </div>

                            <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-login-submit">
                                <i class="fa-solid fa-arrow-right-to-bracket mr-1"></i> Đăng Nhập Ngay
                            </button>
                        </form>

                        <!-- Form: Register -->
                        <form id="register-form" class="${this.activeTab === 'register' ? '' : 'd-none'}" onsubmit="authPage.handleRegister(event)">
                            <div class="form-group">
                                <label class="form-label">Họ và tên của bạn <span class="required-mark">*</span></label>
                                <div class="input-with-icon">
                                    <i class="fa-regular fa-user input-icon"></i>
                                    <input type="text" id="reg-name" class="form-input" placeholder="Ví dụ: Trịnh Quang" required>
                                </div>
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                <div class="form-group">
                                    <label class="form-label">Địa chỉ Email <span class="required-mark">*</span></label>
                                    <div class="input-with-icon">
                                        <i class="fa-regular fa-envelope input-icon"></i>
                                        <input type="email" id="reg-email" class="form-input" placeholder="email@domain.com" required>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Số điện thoại <span class="required-mark">*</span></label>
                                    <div class="input-with-icon">
                                        <i class="fa-solid fa-phone input-icon"></i>
                                        <input type="tel" id="reg-phone" class="form-input" placeholder="0912 345 678" required>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Mật khẩu mới <span class="required-mark">*</span></label>
                                <div class="password-input-wrap input-with-icon">
                                    <i class="fa-solid fa-lock input-icon"></i>
                                    <input type="password" id="reg-password" class="form-input" placeholder="Tối thiểu 6 ký tự..." required minlength="6" oninput="authPage.checkPasswordStrength(this.value)">
                                    <button type="button" class="password-toggle-btn" onclick="authPage.togglePasswordVisibility('reg-password', this)">
                                        <i class="fa-regular fa-eye"></i>
                                    </button>
                                </div>
                                <div class="password-strength-bar">
                                    <div class="strength-segment" id="str-1"></div>
                                    <div class="strength-segment" id="str-2"></div>
                                    <div class="strength-segment" id="str-3"></div>
                                </div>
                                <div class="d-flex justify-between text-xs text-muted mt-1">
                                    <span>Độ bảo mật mật khẩu:</span>
                                    <strong id="str-text" class="text-muted">Chưa nhập</strong>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Nhập lại mật khẩu <span class="required-mark">*</span></label>
                                <div class="password-input-wrap input-with-icon">
                                    <i class="fa-solid fa-lock input-icon"></i>
                                    <input type="password" id="reg-repassword" class="form-input" placeholder="Nhập lại chính xác mật khẩu..." required>
                                    <button type="button" class="password-toggle-btn" onclick="authPage.togglePasswordVisibility('reg-repassword', this)">
                                        <i class="fa-regular fa-eye"></i>
                                    </button>
                                </div>
                                <div class="form-feedback d-none" id="err-reg-repassword">Mật khẩu nhập lại không khớp!</div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Mã xác thực (Captcha) <span class="required-mark">*</span></label>
                                <div class="captcha-container">
                                    <div class="captcha-canvas-box">
                                        <canvas id="reg-captcha-canvas" width="140" height="44" class="captcha-canvas"></canvas>
                                    </div>
                                    <button type="button" class="captcha-refresh-btn" onclick="authPage.refreshCaptcha()">
                                        <i class="fa-solid fa-arrows-rotate"></i>
                                    </button>
                                    <input type="text" id="reg-captcha-input" class="form-input text-uppercase font-bold" placeholder="Nhập mã..." maxlength="6" style="width: 140px;" required>
                                </div>
                                <div class="form-feedback d-none" id="err-reg-captcha">Mã captcha không khớp!</div>
                            </div>

                            <button type="submit" class="btn btn-primary btn-block btn-lg mt-3">
                                <i class="fa-solid fa-user-plus mr-1"></i> Tạo Tài Khoản & Bắt Đầu
                            </button>
                        </form>

                        <!-- Form: Forgot Password -->
                        <form id="forgot-password-form" class="${this.activeTab === 'forgot-password' ? '' : 'd-none'}" onsubmit="authPage.handleForgotPassword(event)">
                            <div class="form-group">
                                <label class="form-label">Email tài khoản cần khôi phục <span class="required-mark">*</span></label>
                                <div class="input-with-icon">
                                    <i class="fa-regular fa-envelope input-icon"></i>
                                    <input type="email" id="forgot-email" class="form-input" placeholder="nhapemail@domain.com" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg mt-3">
                                <i class="fa-solid fa-paper-plane mr-1"></i> Gửi Mã Khôi Phục
                            </button>
                            <div class="text-center mt-3">
                                <a href="javascript:void(0)" class="text-xs text-primary font-semibold hover-underline" onclick="authPage.switchTab('login')"><i class="fa-solid fa-arrow-left mr-1"></i> Quay lại Đăng Nhập</a>
                            </div>
                        </form>

                        <!-- Form: Reset Password -->
                        <form id="reset-password-form" class="${this.activeTab === 'reset-password' ? '' : 'd-none'}" onsubmit="authPage.handleResetPassword(event)">
                            <div class="form-group">
                                <label class="form-label">Mật khẩu mới <span class="required-mark">*</span></label>
                                <div class="password-input-wrap input-with-icon">
                                    <i class="fa-solid fa-lock input-icon"></i>
                                    <input type="password" id="reset-password" class="form-input" placeholder="Tối thiểu 6 ký tự..." required minlength="6">
                                    <button type="button" class="password-toggle-btn" onclick="authPage.togglePasswordVisibility('reset-password', this)">
                                        <i class="fa-regular fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Xác nhận mật khẩu mới <span class="required-mark">*</span></label>
                                <div class="password-input-wrap input-with-icon">
                                    <i class="fa-solid fa-lock input-icon"></i>
                                    <input type="password" id="reset-repassword" class="form-input" placeholder="Nhập lại chính xác mật khẩu..." required>
                                    <button type="button" class="password-toggle-btn" onclick="authPage.togglePasswordVisibility('reset-repassword', this)">
                                        <i class="fa-regular fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg mt-3">
                                <i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Mật Khẩu Mới
                            </button>
                            <div class="text-center mt-3">
                                <a href="javascript:void(0)" class="text-xs text-primary font-semibold hover-underline" onclick="authPage.switchTab('login')"><i class="fa-solid fa-arrow-left mr-1"></i> Quay lại Đăng Nhập</a>
                            </div>
                        </form>

                        <!-- Social Login Divider -->
                        <div class="divider-with-text">Hoặc đăng nhập nhanh với</div>
                        <div class="d-flex gap-2">
                            <button type="button" class="social-login-btn" onclick="appToast.info('Đang kết nối cổng Google Auth...');">
                                <i class="fa-brands fa-google text-danger"></i> Google
                            </button>
                            <button type="button" class="social-login-btn" onclick="appToast.info('Đang kết nối cổng Facebook Auth...');">
                                <i class="fa-brands fa-facebook text-primary"></i> Facebook
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initCaptcha();
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render(document.getElementById('main-view'));
    },

    initCaptcha() {
        setTimeout(() => {
            const canvasId = this.activeTab === 'login' ? 'login-captcha-canvas' : 'reg-captcha-canvas';
            this.captchaInstance = new VisualCaptcha(canvasId);
        }, 50);
    },

    refreshCaptcha() {
        if (this.captchaInstance) {
            this.captchaInstance.generate();
        } else {
            this.initCaptcha();
        }
    },

    togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = '<i class="fa-regular fa-eye-slash text-primary"></i>';
        } else {
            input.type = 'password';
            btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
    },

    checkPasswordStrength(pass) {
        const s1 = document.getElementById('str-1');
        const s2 = document.getElementById('str-2');
        const s3 = document.getElementById('str-3');
        const txt = document.getElementById('str-text');
        if (!s1 || !s2 || !s3 || !txt) return;

        if (!pass) {
            s1.style.backgroundColor = 'transparent';
            s2.style.backgroundColor = 'transparent';
            s3.style.backgroundColor = 'transparent';
            txt.textContent = 'Chưa nhập';
            txt.className = 'text-muted';
            return;
        }

        if (pass.length < 6) {
            s1.style.backgroundColor = '#ef4444';
            s2.style.backgroundColor = 'transparent';
            s3.style.backgroundColor = 'transparent';
            txt.textContent = 'Quá ngắn (Yếu)';
            txt.className = 'text-danger';
        } else if (pass.length >= 6 && pass.length < 10) {
            s1.style.backgroundColor = '#f59e0b';
            s2.style.backgroundColor = '#f59e0b';
            s3.style.backgroundColor = 'transparent';
            txt.textContent = 'Trung bình';
            txt.className = 'text-warning';
        } else {
            s1.style.backgroundColor = '#10b981';
            s2.style.backgroundColor = '#10b981';
            s3.style.backgroundColor = '#10b981';
            txt.textContent = 'Rất mạnh (An toàn)';
            txt.className = 'text-success';
        }
    },

    fillDemo(email, pass) {
        if (this.activeTab !== 'login') {
            this.activeTab = 'login';
            this.render(document.getElementById('main-view'));
        }
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        if (emailInput) emailInput.value = email;
        if (passInput) passInput.value = pass;
        appToast.info(`Đã điền tài khoản: ${email}`);
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value.trim();
        const captchaInput = document.getElementById('login-captcha-input').value.trim();

        // Validate Captcha
        if (!this.captchaInstance.validate(captchaInput)) {
            document.getElementById('err-login-captcha').classList.remove('d-none');
            this.refreshCaptcha();
            return;
        } else {
            document.getElementById('err-login-captcha').classList.add('d-none');
        }

        try {
            const res = await ApiService.auth.login(email, pass);
            store.setUser(res.user, res.token);
            appToast.success(`Chào mừng trở lại, ${res.user.name}!`, 'Đăng Nhập Thành Công');

            if (res.user.role === 'ROLE_ADMIN') {
                store.setRole('admin');
                app.navigate('#/admin');
            } else {
                store.setRole('customer');
                app.navigate('#/');
            }
        } catch (err) {
            appToast.error(err.message || 'Sai email hoặc mật khẩu!');
            this.refreshCaptcha();
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const pass = document.getElementById('reg-password').value.trim();
        const repass = document.getElementById('reg-repassword').value.trim();
        const captchaInput = document.getElementById('reg-captcha-input').value.trim();

        if (pass !== repass) {
            document.getElementById('err-reg-repassword').classList.remove('d-none');
            return;
        } else {
            document.getElementById('err-reg-repassword').classList.add('d-none');
        }

        if (!this.captchaInstance.validate(captchaInput)) {
            document.getElementById('err-reg-captcha').classList.remove('d-none');
            this.refreshCaptcha();
            return;
        } else {
            document.getElementById('err-reg-captcha').classList.add('d-none');
        }

        try {
            const res = await ApiService.auth.register({ name, email, phone, password: pass });
            store.setUser(res.user, res.token);
            appToast.success('Đăng ký tài khoản thành công!', 'Chúc Mừng');

            // Open 5 favorite categories onboarding modal
            setTimeout(() => {
                favoriteGenresModal.open();
            }, 600);

            app.navigate('#/');
        } catch (err) {
            appToast.error(err.message || 'Lỗi khi đăng ký tài khoản!');
            this.refreshCaptcha();
        }
    },

    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();
        appToast.success(`Mã khôi phục đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư.`, 'Gửi Thành Công');
        // Simulate sending email, then go to reset password
        setTimeout(() => {
            this.switchTab('reset-password');
        }, 1500);
    },

    handleResetPassword(e) {
        e.preventDefault();
        const pass = document.getElementById('reset-password').value.trim();
        const repass = document.getElementById('reset-repassword').value.trim();
        
        if (pass !== repass) {
            appToast.error('Mật khẩu xác nhận không khớp!');
            return;
        }

        appToast.success('Mật khẩu đã được đặt lại thành công! Đang chuyển hướng...', 'Thành Công');
        setTimeout(() => {
            this.switchTab('login');
        }, 1500);
    }
};
