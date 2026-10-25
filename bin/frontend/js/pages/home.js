/**
 * HOME PAGE CONTROLLER
 * Hero Banner Slider, Personalized Recommendations, New Releases, Bestsellers,
 * Flash Sale Countdown, and Category Quick Cards.
 */

const homePage = {
    slideIndex: 0,
    slideInterval: null,
    countdownInterval: null,

    async render(container) {
        const books = store.getBooks();
        const recommendedBooks = store.getRecommendedBooks().slice(0, 4);
        const newBooks = books.filter(b => b.isNew).slice(0, 4);
        const bestsellerBooks = [...books].sort((a, b) => b.soldCount - a.soldCount).slice(0, 4);
        const flashSaleBooks = books.filter(b => b.isFlashSale).slice(0, 4);
        const categories = store.getCategories();

        container.innerHTML = `
            <!-- Hero Carousel Slider -->
            <section class="hero-slider-section">
                <div class="container">
                    <div class="hero-slider-container">
                        <!-- Slide 1 -->
                        <div class="hero-slide active" data-slide="0">
                            <div class="hero-slide-content">
                                <div class="hero-tag"><i class="fa-solid fa-sparkles"></i> Lựa Chọn Số 1 Cho Kỹ Sư Phần Mềm</div>
                                <h1 class="hero-title">Khám Phá Nghệ Thuật Viết <span class="gradient-text">Clean Code</span></h1>
                                <p class="hero-desc">
                                    Nâng tầm tư duy lập trình và kiến trúc hệ thống cùng tác phẩm kinh điển của Robert C. Martin. Giảm 21% cùng quà tặng bookmark độc quyền hôm nay.
                                </p>
                                <div class="d-flex items-center gap-3">
                                    <a href="#/book/book_01" class="btn btn-primary btn-lg">
                                        <i class="fa-solid fa-cart-shopping mr-1"></i> Mua Ngay 245.000 ₫
                                    </a>
                                    <a href="#/catalog?category=cat_cntt" class="btn btn-outline-light btn-lg">
                                        Xem Tủ Sách IT <i class="fa-solid fa-arrow-right ml-1"></i>
                                    </a>
                                </div>
                            </div>
                            <div class="hero-slide-image">
                                <div class="hero-book-stack">
                                    <img src="https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80" alt="Clean Code" onerror="this.onerror=null; this.src=app.getBookPlaceholder('Clean Code', 'Công Nghệ IT');">
                                </div>
                            </div>
                        </div>

                        <!-- Slide 2 -->
                        <div class="hero-slide" data-slide="1">
                            <div class="hero-slide-content">
                                <div class="hero-tag"><i class="fa-solid fa-fire"></i> Bestseller Toàn Cầu 15 Triệu Bản</div>
                                <h1 class="hero-title">Thay Đổi Tí Hon <br><span class="gradient-accent">Hiệu Quả Bất Ngờ</span></h1>
                                <p class="hero-desc">
                                    Khám phá cách mạng hóa thói quen mỗi ngày cùng Atomic Habits. Đột phá tư duy và xây dựng hệ thống phát triển cá nhân bền vững.
                                </p>
                                <div class="d-flex items-center gap-3">
                                    <a href="#/book/book_02" class="btn btn-accent btn-lg">
                                        <i class="fa-solid fa-bolt mr-1"></i> Sở Hữu Ngay 159.000 ₫
                                    </a>
                                    <button class="btn btn-outline-light btn-lg" onclick="favoriteGenresModal.open()">
                                        <i class="fa-solid fa-heart-pulse mr-1"></i> Chọn 5 Thể Loại
                                    </button>
                                </div>
                            </div>
                            <div class="hero-slide-image">
                                <div class="hero-book-stack">
                                    <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" alt="Atomic Habits" onerror="this.onerror=null; this.src=app.getBookPlaceholder('Atomic Habits', 'Tâm Lý Học');">
                                </div>
                            </div>
                        </div>

                        <!-- Slide Navigation Dots & Arrows -->
                        <div class="hero-slider-nav">
                            <button class="hero-dot active" onclick="homePage.goToSlide(0)"></button>
                            <button class="hero-dot" onclick="homePage.goToSlide(1)"></button>
                        </div>
                        <button class="hero-arrow-btn hero-arrow-prev" onclick="homePage.prevSlide()"><i class="fa-solid fa-chevron-left"></i></button>
                        <button class="hero-arrow-btn hero-arrow-next" onclick="homePage.nextSlide()"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            </section>

            <!-- Features Highlight Strip -->
            <section class="features-strip-section">
                <div class="container">
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon-wrapper feature-icon-1"><i class="fa-solid fa-truck-fast"></i></div>
                            <div>
                                <h4>Giao Hàng Siêu Tốc 2H</h4>
                                <p>Nội thành TP.HCM & Hà Nội</p>
                            </div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon-wrapper feature-icon-2"><i class="fa-solid fa-shield-halved"></i></div>
                            <div>
                                <h4>100% Sách Chính Hãng</h4>
                                <p>Bảo hành chất lượng in ấn</p>
                            </div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon-wrapper feature-icon-3"><i class="fa-solid fa-qrcode"></i></div>
                            <div>
                                <h4>Thanh Toán VietQR Tiện Lợi</h4>
                                <p>Quét mã chuẩn Napas 24/7</p>
                            </div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon-wrapper feature-icon-4"><i class="fa-solid fa-rotate-left"></i></div>
                            <div>
                                <h4>Đổi Trả 7 Ngày Miễn Phí</h4>
                                <p>Nếu sách lỗi hoặc hư hỏng</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Flash Sale Deal with Live Countdown -->
            <section class="flash-sale-section mb-8">
                <div class="container">
                    <div class="flash-sale-box">
                        <div class="flash-sale-left">
                            <div class="d-flex items-center gap-2">
                                <i class="fa-solid fa-bolt-lightning text-2xl animate-pulse" style="color: #fef08a;"></i>
                                <h3>Flash Sale Giờ Vàng</h3>
                            </div>
                            <div class="countdown-box-timer">
                                <div class="countdown-unit" id="cd-hours">03</div>
                                <span class="countdown-colon">:</span>
                                <div class="countdown-unit" id="cd-mins">45</div>
                                <span class="countdown-colon">:</span>
                                <div class="countdown-unit" id="cd-secs">20</div>
                            </div>
                        </div>
                        <a href="#/catalog?sort=discount" class="btn btn-outline-light btn-sm font-bold">
                            Xem Tất Cả Deal <i class="fa-solid fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                </div>
            </section>

            <!-- Quick Browse Categories -->
            <section class="category-quick-section mb-8">
                <div class="container">
                    <div class="section-header">
                        <div class="section-title-wrap">
                            <h2><span class="section-icon-badge"><i class="fa-solid fa-layer-group"></i></span> Danh Mục Sách Nổi Bật</h2>
                            <p>Chọn ngay chủ đề yêu thích để khám phá kho tàng tri thức</p>
                        </div>
                    </div>
                    <div class="category-pills-row">
                        ${categories.map(c => `
                            <div class="category-pill-card" onclick="app.navigate('#/catalog?category=${c.id}')">
                                <span class="cat-icon text-primary"><i class="${c.icon || 'fa-solid fa-book'}"></i></span>
                                <span class="font-bold text-sm">${c.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- Section 1: Sách Đề Xuất Dành Riêng Cho Bạn (AI / 5 Favorite Genres) -->
            <section class="recommendations-home-section mb-8">
                <div class="container">
                    <div class="section-header">
                        <div class="section-title-wrap">
                            <h2>
                                <span class="section-icon-badge" style="background: #fef3c7; color: #d97706;"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
                                Đề Xuất Dành Riêng Cho Bạn
                            </h2>
                            <p>Được gợi ý thông minh dựa trên 5 thể loại sách bạn đã chọn</p>
                        </div>
                        <div class="d-flex items-center gap-2">
                            <button class="btn btn-ghost btn-sm" onclick="favoriteGenresModal.open()">
                                <i class="fa-solid fa-sliders mr-1"></i> Đổi sở thích
                            </button>
                            <a href="#/recommendations" class="btn btn-primary btn-sm">Xem tất cả đề xuất <i class="fa-solid fa-arrow-right ml-1"></i></a>
                        </div>
                    </div>
                    <div class="book-grid">
                        ${recommendedBooks.map(b => this.renderBookCard(b)).join('')}
                    </div>
                </div>
            </section>

            <!-- Section 2: Sách Bán Chạy Nhất (Bestsellers) -->
            <section class="bestsellers-home-section mb-8">
                <div class="container">
                    <div class="section-header">
                        <div class="section-title-wrap">
                            <h2>
                                <span class="section-icon-badge" style="background: #fee2e2; color: #dc2626;"><i class="fa-solid fa-fire"></i></span>
                                Sách Bán Chạy Nhất
                            </h2>
                            <p>Những cuốn sách được độc giả yêu thích và tìm đọc nhiều nhất tuần qua</p>
                        </div>
                        <a href="#/catalog?sort=bestseller" class="btn btn-ghost btn-sm">Xem tất cả <i class="fa-solid fa-arrow-right ml-1"></i></a>
                    </div>
                    <div class="book-grid">
                        ${bestsellerBooks.map((b, index) => this.renderBookCard(b, { rank: index + 1 })).join('')}
                    </div>
                </div>
            </section>

            <!-- Section 3: Sách Mới Phát Hành (New Arrivals) -->
            <section class="new-arrivals-home-section mb-8">
                <div class="container">
                    <div class="section-header">
                        <div class="section-title-wrap">
                            <h2>
                                <span class="section-icon-badge" style="background: #dcfce7; color: #16a34a;"><i class="fa-solid fa-sparkles"></i></span>
                                Sách Mới Phát Hành
                            </h2>
                            <p>Cập nhật những tựa sách mới nhất từ các nhà xuất bản hàng đầu</p>
                        </div>
                        <a href="#/catalog?sort=new" class="btn btn-ghost btn-sm">Xem tất cả <i class="fa-solid fa-arrow-right ml-1"></i></a>
                    </div>
                    <div class="book-grid">
                        ${newBooks.map(b => this.renderBookCard(b)).join('')}
                    </div>
                </div>
            </section>
        `;

        this.initSlider();
        this.initCountdown();
    },

    renderBookCard(book, options = {}) {
        const isFav = store.isWishlisted(book.id);
        const rankBadge = options.rank ? `<span class="tag-badge badge badge-accent">TOP #${options.rank}</span>` : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-card-cover-wrap">
                    <img src="${book.coverImage}" alt="${book.title}" class="book-card-cover" loading="lazy" onerror="this.onerror=null; this.src=app.getBookPlaceholder('${book.title}', '${book.categoryName}');">
                    
                    ${book.discountPercent ? `<span class="discount-tag">-${book.discountPercent}%</span>` : ''}
                    ${rankBadge}

                    <button class="wishlist-toggle-btn ${isFav ? 'favorited' : ''}" 
                            title="${isFav ? 'Bỏ thích' : 'Yêu thích'}" 
                            onclick="app.toggleWishlist('${book.id}', this)">
                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>

                    <button class="quick-view-overlay-btn" onclick="modalManager.openQuickView('${book.id}')">
                        <i class="fa-solid fa-eye mr-1"></i> Xem Nhanh
                    </button>
                </div>

                <div class="book-card-body">
                    <div class="book-genre-label">${book.categoryName}</div>
                    <h3 class="book-card-title">
                        <a href="#/book/${book.id}" title="${book.title}">${book.title}</a>
                    </h3>
                    <div class="book-card-author"><i class="fa-solid fa-feather mr-1"></i> ${book.authorName}</div>
                    
                    <div class="book-card-rating-row">
                        <div class="star-rating">
                            <i class="fa-solid fa-star"></i>
                            <span class="font-bold ml-1">${book.rating}</span>
                        </div>
                        <span class="book-card-sold-count">Đã bán ${book.soldCount}</span>
                    </div>

                    <div class="book-card-price-row">
                        <div>
                            <span class="current-price">${store.formatCurrency(book.price)}</span>
                            ${book.originalPrice ? `<span class="original-price">${store.formatCurrency(book.originalPrice)}</span>` : ''}
                        </div>
                        <button class="btn-add-cart-mini" title="Thêm vào giỏ" onclick="app.addToCart('${book.id}')">
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    initSlider() {
        clearInterval(this.slideInterval);
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    },

    goToSlide(index) {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        if (!slides.length) return;

        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        this.slideIndex = index;
        if (this.slideIndex >= slides.length) this.slideIndex = 0;
        if (this.slideIndex < 0) this.slideIndex = slides.length - 1;

        if (slides[this.slideIndex]) slides[this.slideIndex].classList.add('active');
        if (dots[this.slideIndex]) dots[this.slideIndex].classList.add('active');
    },

    nextSlide() {
        this.goToSlide(this.slideIndex + 1);
    },

    prevSlide() {
        this.goToSlide(this.slideIndex - 1);
    },

    initCountdown() {
        clearInterval(this.countdownInterval);
        let totalSeconds = 3 * 3600 + 45 * 60 + 20;

        this.countdownInterval = setInterval(() => {
            totalSeconds--;
            if (totalSeconds <= 0) totalSeconds = 24 * 3600;

            const hours = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;

            const hEl = document.getElementById('cd-hours');
            const mEl = document.getElementById('cd-mins');
            const sEl = document.getElementById('cd-secs');

            if (hEl) hEl.textContent = String(hours).padStart(2, '0');
            if (mEl) mEl.textContent = String(mins).padStart(2, '0');
            if (sEl) sEl.textContent = String(secs).padStart(2, '0');
        }, 1000);
    }
};
