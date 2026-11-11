/**
 * BOOKNEST APPLICATION MAIN ROUTER & CONTROLLER
 * Single-page router, kiểm tra quyền quản trị, dark/light theme switcher,
 * global event delegation, and bootstrap initialization.
 */

const app = {
    routeSeq: 0,

    async init() {
        console.log("BookNest Frontend Application Initializing...");

        this.initTheme();

        store.subscribe((event) => {
            navbarComponent.updateBadges();
            if (event === 'auth_changed') {
                navbarComponent.render();
            }
        });

        window.addEventListener('hashchange', () => this.route());

        // Nạp danh mục + phiên đăng nhập trước khi vẽ trang đầu tiên
        await store.init();
        this.route();
    },

    // Trả về hàm cho biết trang vẫn còn đang được xem (tránh vẽ đè khi đã chuyển trang)
    routeChecker() {
        const rid = this.routeSeq;
        return () => rid === this.routeSeq;
    },

    // Chặn thao tác cần đăng nhập
    requireLogin(message = 'Vui lòng đăng nhập để tiếp tục!') {
        if (store.currentUser) return true;
        appToast.info(message, 'Đăng Nhập');
        this.navigate('#/auth');
        return false;
    },

    // Hiển thị lỗi từ API dưới dạng toast
    showError(err) {
        appToast.error((err && err.message) || 'Đã có lỗi xảy ra!');
    },

    initTheme() {
        const savedTheme = localStorage.getItem('booknest_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeButtonIcon(savedTheme);

        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme') || 'light';
                const next = current === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('booknest_theme', next);
                this.updateThemeButtonIcon(next);
                appToast.info(`Đã đổi sang chế độ ${next === 'dark' ? 'Tối 🌙' : 'Sáng ☀️'}`);
            });
        }
    },

    updateThemeButtonIcon(theme) {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme === 'dark' 
                ? '<i class="fa-solid fa-sun text-accent"></i>' 
                : '<i class="fa-solid fa-moon"></i>';
        }
    },

    navigate(url) {
        window.location.hash = url;
    },

    async route() {
        this.routeSeq++;
        const hash = window.location.hash || '#/';
        const mainView = document.getElementById('main-view');

        // Render Navbar
        navbarComponent.render();

        // Parse query params
        const [pathWithParams] = hash.split('?');
        const queryString = hash.includes('?') ? hash.split('?')[1] : '';
        const queryParams = Object.fromEntries(new URLSearchParams(queryString));

        // Highlight Mobile Nav
        this.highlightMobileNav(pathWithParams);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Trang quản trị chỉ dành cho ADMIN / STAFF
        if (pathWithParams === '#/admin' && !store.canAdmin) {
            appToast.error(store.currentUser ? 'Bạn không có quyền vào trang quản trị!' : 'Vui lòng đăng nhập bằng tài khoản quản trị!');
            this.navigate(store.currentUser ? '#/' : '#/auth');
            return;
        }

        try {
            await this.renderRoute(mainView, pathWithParams, queryParams);
        } catch (err) {
            console.error(err);
            mainView.innerHTML = `
                <div class="container py-12 text-center">
                    <h3 class="text-xl font-bold mb-2">Không tải được trang</h3>
                    <p class="text-muted text-sm mb-4">${(err && err.message) || 'Đã có lỗi xảy ra.'}</p>
                    <button class="btn btn-primary" onclick="app.route()">Thử Lại</button>
                </div>`;
        }
    },

    async renderRoute(mainView, pathWithParams, queryParams) {
        // Route Matching
        if (pathWithParams === '#/' || pathWithParams === '') {
            await homePage.render(mainView);
        } else if (pathWithParams === '#/catalog') {
            await catalogPage.render(mainView, queryParams);
        } else if (pathWithParams.startsWith('#/book/')) {
            const bookId = pathWithParams.replace('#/book/', '');
            await bookDetailPage.render(mainView, bookId);
        } else if (pathWithParams === '#/cart') {
            await cartPage.render(mainView);
        } else if (pathWithParams === '#/checkout') {
            await checkoutPage.render(mainView);
        } else if (pathWithParams === '#/auth') {
            await authPage.render(mainView);
        } else if (pathWithParams === '#/profile') {
            await profilePage.render(mainView, queryParams);
        } else if (pathWithParams === '#/wishlist') {
            await wishlistPage.render(mainView);
        } else if (pathWithParams === '#/recommendations') {
            await recommendationsPage.render(mainView);
        } else if (pathWithParams === '#/admin') {
            await adminPage.render(mainView, queryParams);
        } else {
            // 404 Fallback
            mainView.innerHTML = `
                <div class="container py-12 text-center">
                    <div style="background: var(--bg-surface); padding: 4rem 2rem; border-radius: var(--radius-xl); border: 1px solid var(--border-color); max-width: 500px; margin: 0 auto;">
                        <h1 class="text-4xl font-bold text-primary mb-2">404</h1>
                        <h3 class="text-xl font-bold mb-2">Trang Không Tồn Tại</h3>
                        <p class="text-muted text-sm mb-6">Đường dẫn bạn truy cập có thể đã bị thay đổi hoặc không tồn tại.</p>
                        <a href="#/" class="btn btn-primary">Quay Về Trang Chủ</a>
                    </div>
                </div>
            `;
        }
    },

    highlightMobileNav(path) {
        document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
        if (path === '#/' || path === '') document.getElementById('mob-nav-home')?.classList.add('active');
        else if (path.includes('catalog')) document.getElementById('mob-nav-catalog')?.classList.add('active');
        else if (path.includes('recommend')) document.getElementById('mob-nav-recommend')?.classList.add('active');
        else if (path.includes('cart')) document.getElementById('mob-nav-cart')?.classList.add('active');
        else if (path.includes('profile')) document.getElementById('mob-nav-profile')?.classList.add('active');
    },

    // Quick Action Helpers
    async addToCart(bookId, qty = 1) {
        if (!this.requireLogin('Vui lòng đăng nhập để thêm sách vào giỏ hàng!')) return false;
        try {
            await store.addToCart(bookId, qty);
            const book = store.getBook(bookId);
            appToast.success(`Đã thêm "${book ? book.title : 'sách'}" vào giỏ hàng!`, 'Giỏ Hàng');
            return true;
        } catch (err) {
            this.showError(err);
            return false;
        }
    },

    async toggleWishlist(bookId, element) {
        if (!this.requireLogin('Vui lòng đăng nhập để lưu sách yêu thích!')) return;
        try {
            const isFav = await store.toggleWishlist(bookId);
            if (element) {
                element.classList.toggle('favorited', isFav);
                element.innerHTML = isFav ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
            }
            if (isFav) appToast.success('Đã thêm cuốn sách vào danh sách yêu thích!');
            else appToast.info('Đã bỏ sách khỏi danh sách yêu thích.');
        } catch (err) {
            this.showError(err);
        }
    },

    openFavoriteModal() {
        favoriteGenresModal.open();
    },

    showToast(msg, type = 'info') {
        appToast.show(msg, type);
    },

    getBookPlaceholder(title = 'BookNest', category = 'Sách Hay') {
        const cleanTitle = (title || 'BookNest').replace(/["'<>]/g, '').substring(0, 30);
        const cleanCat = (category || 'BookNest').replace(/["'<>]/g, '');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550" viewBox="0 0 400 550">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4f46e5" />
                    <stop offset="50%" stop-color="#312e81" />
                    <stop offset="100%" stop-color="#1e1b4b" />
                </linearGradient>
            </defs>
            <rect width="400" height="550" rx="16" fill="url(#grad)" />
            <rect x="20" y="20" width="360" height="510" rx="10" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
            <circle cx="200" cy="180" r="45" fill="rgba(255,255,255,0.15)" />
            <text x="200" y="195" font-family="'Plus Jakarta Sans', sans-serif" font-size="40" font-weight="bold" fill="#fef08a" text-anchor="middle">📖</text>
            <rect x="60" y="255" width="280" height="30" rx="15" fill="rgba(255,255,255,0.2)" />
            <text x="200" y="275" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanCat}</text>
            <text x="200" y="340" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanTitle}</text>
            <text x="200" y="470" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" fill="#cbd5e1" text-anchor="middle">★ ★ ★ ★ ★ BOOKNEST OFFICIAL</text>
        </svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
};

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

