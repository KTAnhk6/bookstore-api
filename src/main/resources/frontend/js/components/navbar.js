/**
 * MAIN NAVBAR & HEADER COMPONENT
 * Renders header, live search bar, user dropdown menu, cart/wishlist counters,
 * and category quick navigation bar.
 */

const navbarComponent = {
    // Danh mục hiện trên thanh phụ (slug -> icon), lấy theo thứ tự này nếu có trong database
    subNavCategories: {
        'cong-nghe-thong-tin': 'fa-code',
        'kinh-doanh': 'fa-chart-line',
        'tam-ly-ky-nang-song': 'fa-brain',
        'van-hoc-nuoc-ngoai': 'fa-feather',
        'khoa-hoc': 'fa-atom'
    },

    render() {
        const header = document.getElementById('main-header');
        const user = store.currentUser;
        const cartCount = store.getCartCount();
        const wishlistCount = store.getWishlist().length;
        const currentCategory = (location.hash.match(/[?&]category=([^&]+)/) || [])[1];
        const subNav = Object.keys(this.subNavCategories)
            .map(slug => store.getCategories().find(c => c.slug === slug))
            .filter(Boolean);

        header.innerHTML = `
            <div class="container">
                <div class="header-main-nav">
                    <!-- Brand Logo -->
                    <a href="#/" class="brand-logo">
                        <div class="logo-icon"><i class="fa-solid fa-book-bookmark"></i></div>
                        <span class="logo-text">Book<span class="gradient-text">Nest</span></span>
                    </a>

                    <!-- Live Search Bar -->
                    <div class="header-search-wrapper">
                        <i class="fa-solid fa-magnifying-glass header-search-icon"></i>
                        <input type="text" id="global-search-input" class="header-search-input" 
                               placeholder="Tìm theo tên sách hoặc tác giả" autocomplete="off">
                        <button class="header-search-btn" id="btn-submit-search">Tìm kiếm</button>
                        
                        <!-- Search Suggestions Dropdown -->
                        <div class="search-suggest-dropdown" id="search-suggestions-box"></div>
                    </div>

                    <!-- Navigation Actions -->
                    <div class="header-actions">
                        <!-- Quick Genre Preference Button -->
                        <button class="btn btn-outline-primary btn-sm d-none d-lg-inline-flex" id="btn-open-pref-modal" 
                                onclick="favoriteGenresModal.open()" title="Cá nhân hoá sách theo 5 thể loại yêu thích">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> 5 Sở Thích
                        </button>

                        <!-- Wishlist Button -->
                        <a href="#/wishlist" class="icon-badge-btn" title="Sách yêu thích">
                            <i class="fa-regular fa-heart"></i>
                            <span class="badge-counter" id="header-wishlist-count">${wishlistCount}</span>
                        </a>

                        <!-- Shopping Cart Button -->
                        <a href="#/cart" class="icon-badge-btn" title="Giỏ hàng của bạn">
                            <i class="fa-solid fa-cart-shopping"></i>
                            <span class="badge-counter" id="header-cart-count">${cartCount}</span>
                        </a>

                        <!-- User Menu / Auth Button -->
                        ${user ? `
                            <div class="user-menu-wrapper" id="user-menu-wrapper">
                                <button class="user-menu-btn" id="user-menu-toggle-btn">
                                    <div class="user-avatar-sm">${esc(user.name.charAt(0))}</div>
                                    <span class="user-display-name">${esc(user.name.split(' ').pop())}</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-muted"></i>
                                </button>
                                
                                <div class="user-dropdown-menu" id="user-dropdown-menu">
                                    <div class="user-dropdown-header">
                                        <div class="font-bold text-sm text-truncate">${esc(user.name)}</div>
                                        <div class="text-xs text-muted">${esc(user.email)}</div>
                                        <span class="badge ${store.canAdmin ? 'badge-primary' : 'badge-subtle'} mt-1">
                                            ${user.role === 'ADMIN' ? 'Quản Trị Viên' : user.role === 'STAFF' ? 'Nhân Viên' : 'Khách Hàng'}
                                        </span>
                                    </div>
                                    <a href="#/profile" class="user-dropdown-item"><i class="fa-solid fa-user"></i> Tài Khoản & Sổ Địa Chỉ</a>
                                    <a href="#/profile?tab=orders" class="user-dropdown-item"><i class="fa-solid fa-box-archive"></i> Đơn Hàng Của Tôi</a>
                                    <a href="#/recommendations" class="user-dropdown-item"><i class="fa-solid fa-sparkles"></i> Sách Đề Xuất Cho Tôi</a>
                                    <div class="user-dropdown-item" onclick="favoriteGenresModal.open()"><i class="fa-solid fa-heart-pulse"></i> Đổi 5 Thể Loại Yêu Thích</div>
                                    ${store.canAdmin ? '<a href="#/admin" class="user-dropdown-item"><i class="fa-solid fa-gauge-high"></i> Trang Quản Trị</a>' : ''}
                                    <div class="user-dropdown-item danger-item" onclick="store.logout(); appToast.info('Đã đăng xuất thành công!'); app.navigate('#/auth');"><i class="fa-solid fa-right-from-bracket"></i> Đăng Xuất</div>
                                </div>
                            </div>
                        ` : `
                            <a href="#/auth" class="btn btn-primary btn-sm">
                                <i class="fa-solid fa-arrow-right-to-bracket mr-1"></i> Đăng Nhập
                            </a>
                        `}
                    </div>
                </div>
            </div>

            <!-- Sub-Navbar / Categories Ribbon -->
            <div class="sub-nav-bar">
                <div class="container">
                    <div class="sub-nav-list">
                        <a href="#/catalog" class="sub-nav-item ${location.hash.startsWith('#/catalog') && !currentCategory ? 'active' : ''}"><i class="fa-solid fa-grid-2 mr-1"></i> Tất Cả Sách</a>
                        ${subNav.map(c => `<a href="#/catalog?category=${c.id}" class="sub-nav-item ${currentCategory === String(c.id) || currentCategory === c.slug ? 'active' : ''}"><i class="fa-solid ${this.subNavCategories[c.slug]} mr-1"></i> ${esc(c.name)}</a>`).join('')}
                        <a href="#/recommendations" class="sub-nav-item text-primary font-bold"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Đề Xuất Theo Sở Thích</a>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
    },

    attachEvents() {
        // Toggle User Dropdown
        const userMenuBtn = document.getElementById('user-menu-toggle-btn');
        const userDropdown = document.getElementById('user-dropdown-menu');
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('active');
            });
        }

        // Live Search Input Debounce
        const searchInput = document.getElementById('global-search-input');
        const suggestBox = document.getElementById('search-suggestions-box');
        const searchBtn = document.getElementById('btn-submit-search');

        let debounceTimer;
        if (searchInput && suggestBox) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                const query = e.target.value.trim();

                if (!query) {
                    suggestBox.classList.remove('active');
                    suggestBox.innerHTML = '';
                    return;
                }

                debounceTimer = setTimeout(async () => {
                    let filtered = [];
                    try {
                        filtered = (await ApiService.books.list({ keyword: query, size: 5 })).items;
                    } catch (err) { /* hiện "không tìm thấy" */ }
                    if (searchInput.value.trim() !== query) return; // đã gõ tiếp, bỏ kết quả cũ

                    if (filtered.length > 0) {
                        suggestBox.innerHTML = filtered.map(b => `
                            <div class="suggest-item" onclick="app.navigate('#/book/${b.id}'); document.getElementById('search-suggestions-box').classList.remove('active');">
                                <img src="${esc(b.coverImage)}" alt="${esc(b.title)}">
                                <div class="flex-1">
                                    <div class="text-sm font-bold text-truncate">${esc(b.title)}</div>
                                    <div class="text-xs text-muted">${esc(b.authorName)} • <span class="text-primary font-semibold">${store.formatCurrency(b.price)}</span></div>
                                </div>
                            </div>
                        `).join('') + `
                            <div class="p-2 text-center text-xs text-primary font-bold bg-subtle cursor-pointer"
                                 onclick="app.navigate('#/catalog?keyword=${encodeURIComponent(query)}'); document.getElementById('search-suggestions-box').classList.remove('active');">
                                Xem tất cả kết quả cho "${esc(query)}" <i class="fa-solid fa-arrow-right ml-1"></i>
                            </div>
                        `;
                        suggestBox.classList.add('active');
                    } else {
                        suggestBox.innerHTML = `
                            <div class="p-4 text-center text-sm text-muted">
                                <i class="fa-regular fa-face-frown mb-1" style="font-size: 1.5rem;"></i>
                                <p>Không tìm thấy sách phù hợp với "${esc(query)}"</p>
                            </div>
                        `;
                        suggestBox.classList.add('active');
                    }
                }, 300);
            });

            // Enter key trigger
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const val = searchInput.value.trim();
                    if (val) {
                        suggestBox.classList.remove('active');
                        app.navigate(`#/catalog?keyword=${encodeURIComponent(val)}`);
                    }
                }
            });

            searchBtn.addEventListener('click', () => {
                const val = searchInput.value.trim();
                if (val) {
                    suggestBox.classList.remove('active');
                    app.navigate(`#/catalog?keyword=${encodeURIComponent(val)}`);
                }
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestBox.contains(e.target)) {
                    suggestBox.classList.remove('active');
                }
            });
        }
    },

    updateBadges() {
        const cartBadge = document.getElementById('header-cart-count');
        const wishlistBadge = document.getElementById('header-wishlist-count');
        const mobCartBadge = document.querySelector('.mobile-bottom-nav .cart-count-badge');

        if (cartBadge) cartBadge.textContent = store.getCartCount();
        if (mobCartBadge) mobCartBadge.textContent = store.getCartCount();
        if (wishlistBadge) wishlistBadge.textContent = store.getWishlist().length;
    }
};
