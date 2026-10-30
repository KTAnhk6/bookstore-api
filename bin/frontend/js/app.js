/**
 * BOOKNEST APPLICATION MAIN ROUTER & CONTROLLER
 * Single-page router, role toggling, dark/light theme switcher,
 * global event delegation, and bootstrap initialization.
 */

const app = {
    init() {
        console.log("BookNest Frontend Application Initializing...");

        // Setup Theme
        this.initTheme();

        // Setup Store Subscriptions
        store.subscribe((event, data) => {
            navbarComponent.updateBadges();
            if (event === 'role_changed') {
                this.updateRoleUI(data);
                this.route();
            }
            if (event === 'auth_changed') {
                navbarComponent.render();
            }
        });

        // Initialize Router
        window.addEventListener('hashchange', () => this.route());
        window.addEventListener('load', () => this.route());

        // Global Event Handlers
        this.attachGlobalEvents();

        // Initial Route
        this.route();
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

    attachGlobalEvents() {
        // Role Switcher Button
        const roleBtn = document.getElementById('btn-toggle-role');
        if (roleBtn) {
            roleBtn.addEventListener('click', () => {
                this.toggleRole();
            });
        }
    },

    toggleRole() {
        const nextRole = store.toggleRole();
        if (nextRole === 'admin') {
            appToast.success('Đã chuyển sang Giao diện Quản trị (Minh Anh)', 'Phân Quyền');
            this.navigate('#/admin');
        } else {
            appToast.info('Đã chuyển sang Giao diện Khách hàng (Quang)', 'Phân Quyền');
            this.navigate('#/');
        }
    },

    updateRoleUI(role) {
        const badge = document.getElementById('current-role-badge');
        const btn = document.getElementById('btn-toggle-role');

        if (role === 'admin') {
            if (badge) badge.innerHTML = '<i class="fa-solid fa-user-shield"></i> Giao diện Quản trị';
            if (btn) btn.innerHTML = '<i class="fa-solid fa-repeat"></i> Đổi sang Khách hàng';
        } else {
            if (badge) badge.innerHTML = '<i class="fa-solid fa-user-tag"></i> Giao diện Khách hàng';
            if (btn) btn.innerHTML = '<i class="fa-solid fa-repeat"></i> Đổi sang Quản trị';
        }
    },

    navigate(url) {
        window.location.hash = url;
    },

    route() {
        const hash = window.location.hash || '#/';
        const mainView = document.getElementById('main-view');
        const currentRole = store.activeRole;

        // Render Navbar
        navbarComponent.render();
        this.updateRoleUI(currentRole);

        // Parse query params
        const [pathWithParams] = hash.split('?');
        const queryString = hash.includes('?') ? hash.split('?')[1] : '';
        const queryParams = Object.fromEntries(new URLSearchParams(queryString));

        // Highlight Mobile Nav
        this.highlightMobileNav(pathWithParams);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Route Matching
        if (pathWithParams === '#/' || pathWithParams === '') {
            homePage.render(mainView);
        } else if (pathWithParams === '#/catalog') {
            catalogPage.render(mainView, queryParams);
        } else if (pathWithParams.startsWith('#/book/')) {
            const bookId = pathWithParams.replace('#/book/', '');
            bookDetailPage.render(mainView, bookId);
        } else if (pathWithParams === '#/cart') {
            cartPage.render(mainView);
        } else if (pathWithParams === '#/checkout') {
            checkoutPage.render(mainView);
        } else if (pathWithParams === '#/auth') {
            authPage.render(mainView);
        } else if (pathWithParams === '#/profile') {
            profilePage.render(mainView, queryParams);
        } else if (pathWithParams === '#/wishlist') {
            wishlistPage.render(mainView);
        } else if (pathWithParams === '#/recommendations') {
            recommendationsPage.render(mainView);
        } else if (pathWithParams === '#/admin') {
            adminPage.render(mainView, queryParams);
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
    addToCart(bookId, qty = 1) {
        const book = store.getBooks().find(b => b.id === bookId);
        if (book) {
            store.addToCart(book, qty);
            appToast.success(`Đã thêm "${book.title}" vào giỏ hàng!`, 'Giỏ Hàng');
        }
    },

    toggleWishlist(bookId, element) {
        const isFav = store.toggleWishlist(bookId);
        if (element) {
            if (isFav) {
                element.classList.add('favorited');
                element.innerHTML = '<i class="fa-solid fa-heart"></i>';
                appToast.success('Đã thêm cuốn sách vào danh sách yêu thích!');
            } else {
                element.classList.remove('favorited');
                element.innerHTML = '<i class="fa-regular fa-heart"></i>';
                appToast.info('Đã bỏ sách khỏi danh sách yêu thích.');
            }
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

