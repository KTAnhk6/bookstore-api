/**
 * HOME PAGE CONTROLLER
 * Hero Banner Slider, Personalized Recommendations, New Releases, Bestsellers,
 * sách đang giảm giá và danh mục. Toàn bộ dữ liệu lấy từ backend.
 */

const homePage = {
    slideIndex: 0,
    slideInterval: null,

    async render(container) {
        const stillHere = app.routeChecker();
        container.innerHTML = '<div class="container py-12 text-center"><div class="spinner-ring"></div></div>';

        const [recommendedBooks, bestsellerBooks, newBooks, catalogBooks] = await Promise.all([
            store.currentUser ? ApiService.recommendations.forMe(4).catch(() => []) : Promise.resolve([]),
            ApiService.books.bestsellers(4).catch(() => []),
            ApiService.books.newest(4).catch(() => []),
            ApiService.books.list({ size: 100, sortBy: 'newest' }).then(r => r.items).catch(() => [])
        ]);
        if (!stillHere()) return;

        const flashSaleBooks = catalogBooks.filter(b => b.isFlashSale)
            .sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 4);
        const slides = this.buildSlides(bestsellerBooks[0], newBooks[0], flashSaleBooks[0] || catalogBooks[0]);
        const categories = store.getCategories();
        const hasFavorites = store.getFavoriteCategories().length > 0;

        container.innerHTML = `
            <!-- Hero Carousel Slider -->
            <section class="hero-slider-section">
                <div class="container">
                    <div class="hero-slider-container">
                        ${slides.map((s, i) => this.renderSlide(s, i)).join('')}
                        <div class="hero-slider-nav">
                            ${slides.map((s, i) => `<button class="hero-dot ${i === 0 ? 'active' : ''}" onclick="homePage.goToSlide(${i})"></button>`).join('')}
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
                                <h4>Miễn Phí Ship Từ 300K</h4>
                                <p>Đơn dưới 300K phí ship 30.000 ₫</p>
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

            ${flashSaleBooks.length ? `
            <!-- Sách đang giảm giá -->
            <section class="flash-sale-section mb-8">
                <div class="container">
                    <div class="flash-sale-box mb-4">
                        <div class="flash-sale-left">
                            <div class="d-flex items-center gap-2">
                                <i class="fa-solid fa-bolt-lightning text-2xl animate-pulse" style="color: #fef08a;"></i>
                                <h3>Đang Giảm Giá</h3>
                            </div>
                            <span class="text-sm">Giá ưu đãi đang áp dụng cho các đầu sách dưới đây</span>
                        </div>
                        <a href="#/catalog?sort=newest" class="btn btn-outline-light btn-sm font-bold">
                            Xem Tất Cả Sách <i class="fa-solid fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                    <div class="book-grid">
                        ${flashSaleBooks.map(b => this.renderBookCard(b)).join('')}
                    </div>
                </div>
            </section>` : ''}

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
                                <span class="cat-icon text-primary"><i class="${esc(c.icon || 'fa-solid fa-book')}"></i></span>
                                <span class="font-bold text-sm">${esc(c.name)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- Sách đề xuất dành riêng cho bạn -->
            <section class="recommendations-home-section mb-8">
                <div class="container">
                    <div class="section-header">
                        <div class="section-title-wrap">
                            <h2>
                                <span class="section-icon-badge" style="background: #fef3c7; color: #d97706;"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
                                Đề Xuất Dành Riêng Cho Bạn
                            </h2>
                            <p>${!store.currentUser ? 'Đăng nhập để nhận gợi ý đúng gu đọc sách của bạn'
                                : hasFavorites ? 'Được gợi ý dựa trên các thể loại sách bạn đã chọn'
                                : 'Chọn thể loại yêu thích để nhận gợi ý đúng gu của bạn'}</p>
                        </div>
                        <div class="d-flex items-center gap-2">
                            <button class="btn btn-ghost btn-sm" onclick="favoriteGenresModal.open()">
                                <i class="fa-solid fa-sliders mr-1"></i> Đổi sở thích
                            </button>
                            <a href="#/recommendations" class="btn btn-primary btn-sm">Xem tất cả đề xuất <i class="fa-solid fa-arrow-right ml-1"></i></a>
                        </div>
                    </div>
                    <div class="book-grid">
                        ${(recommendedBooks.length ? recommendedBooks : bestsellerBooks).map(b => this.renderBookCard(b)).join('')}
                    </div>
                </div>
            </section>

            <!-- Sách bán chạy nhất -->
            <section class="bestsellers-home-section mb-8">
                <div class="container">
                    <div class="section-header">
                        <div class="section-title-wrap">
                            <h2>
                                <span class="section-icon-badge" style="background: #fee2e2; color: #dc2626;"><i class="fa-solid fa-fire"></i></span>
                                Sách Bán Chạy Nhất
                            </h2>
                            <p>Những cuốn sách được độc giả mua nhiều nhất</p>
                        </div>
                        <a href="#/catalog?sort=sales_desc" class="btn btn-ghost btn-sm">Xem tất cả <i class="fa-solid fa-arrow-right ml-1"></i></a>
                    </div>
                    <div class="book-grid">
                        ${bestsellerBooks.map((b, index) => this.renderBookCard(b, { rank: index + 1 })).join('')}
                    </div>
                </div>
            </section>

            <!-- Sách mới phát hành -->
            <section class="new-arrivals-home-section mb-8">
                <div class="container">
                    <div class="section-header">
                        <div class="section-title-wrap">
                            <h2>
                                <span class="section-icon-badge" style="background: #dcfce7; color: #16a34a;"><i class="fa-solid fa-sparkles"></i></span>
                                Sách Mới Phát Hành
                            </h2>
                            <p>Cập nhật những tựa sách mới nhất từ các nhà xuất bản</p>
                        </div>
                        <a href="#/catalog?sort=newest" class="btn btn-ghost btn-sm">Xem tất cả <i class="fa-solid fa-arrow-right ml-1"></i></a>
                    </div>
                    <div class="book-grid">
                        ${newBooks.map(b => this.renderBookCard(b)).join('')}
                    </div>
                </div>
            </section>
        `;

        this.slideIndex = 0;
        this.initSlider();
    },

    // Banner: mỗi slide quảng bá một cuốn sách thật từ database (bỏ trùng)
    buildSlides(bestseller, newest, deal) {
        const seen = new Set();
        return [
            { book: bestseller, tag: '<i class="fa-solid fa-fire"></i> Bán Chạy Nhất', lead: 'Được Mua Nhiều Nhất', btn: 'btn-primary' },
            { book: newest, tag: '<i class="fa-solid fa-sparkles"></i> Mới Phát Hành', lead: 'Vừa Lên Kệ', btn: 'btn-accent' },
            { book: deal, tag: '<i class="fa-solid fa-bolt"></i> Ưu Đãi Hôm Nay', lead: 'Giá Tốt Hôm Nay', btn: 'btn-primary' }
        ].filter(s => s.book && !seen.has(s.book.id) && seen.add(s.book.id));
    },

    renderSlide(s, i) {
        const b = s.book;
        const title = b.title.length > 46 ? b.title.slice(0, 44) + '…' : b.title;
        const desc = b.description
            ? (b.description.length > 170 ? b.description.slice(0, 168) + '…' : b.description)
            : `Tác phẩm của ${b.authorName} thuộc thể loại ${b.categoryName}.`;
        return `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" data-slide="${i}">
                <div class="hero-slide-content">
                    <div class="hero-tag">${s.tag}</div>
                    <h1 class="hero-title">${s.lead} <br><span class="gradient-text">${esc(title)}</span></h1>
                    <p class="hero-desc">${esc(desc)}</p>
                    <div class="d-flex items-center gap-3">
                        <a href="#/book/${b.id}" class="btn ${s.btn} btn-lg">
                            <i class="fa-solid fa-cart-shopping mr-1"></i> Mua Ngay ${store.formatCurrency(b.price)}
                        </a>
                        <a href="#/catalog?category=${b.categoryId}" class="btn btn-outline-light btn-lg">
                            ${esc(b.categoryName)} <i class="fa-solid fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                </div>
                <div class="hero-slide-image">
                    <div class="hero-book-stack">
                        <img src="${esc(b.coverImage)}" alt="${esc(b.title)}" onerror="this.onerror=null; this.src=app.getBookPlaceholder(this.alt, '');">
                    </div>
                </div>
            </div>`;
    },

    renderBookCard(book, options = {}) {
        const isFav = store.isWishlisted(book.id);
        const rankBadge = options.rank ? `<span class="tag-badge badge badge-accent">TOP #${options.rank}</span>` : '';

        return `
            <div class="book-card" data-book-id="${book.id}">
                <div class="book-card-cover-wrap">
                    <img src="${esc(book.coverImage)}" alt="${esc(book.title)}" class="book-card-cover" loading="lazy" onerror="this.onerror=null; this.src=app.getBookPlaceholder(this.alt, '');">

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
                    <div class="book-genre-label">${esc(book.categoryName)}</div>
                    <h3 class="book-card-title">
                        <a href="#/book/${book.id}" title="${esc(book.title)}">${esc(book.title)}</a>
                    </h3>
                    <div class="book-card-author"><i class="fa-solid fa-feather mr-1"></i> ${esc(book.authorName)}</div>

                    <div class="book-card-rating-row">
                        <div class="star-rating">
                            <i class="fa-solid fa-star"></i>
                            <span class="font-bold ml-1">${book.reviewCount ? book.rating.toFixed(1) : 'Mới'}</span>
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
    }
};
