/**
 * BOOK DETAIL PAGE CONTROLLER
 * Thông tin sách, đánh giá thật từ khách đã mua, và sách liên quan — tất cả lấy từ backend.
 */

const bookDetailPage = {
    selectedRating: 5,

    async render(container, bookId) {
        const stillHere = app.routeChecker();
        container.innerHTML = '<div class="container py-12 text-center"><div class="spinner-ring"></div></div>';

        try {
            const [book, reviewPage, summary] = await Promise.all([
                ApiService.books.get(bookId),
                ApiService.reviews.byBook(bookId),
                ApiService.reviews.summary(bookId)
            ]);
            if (!stillHere()) return;

            const reviews = reviewPage.items;
            const relatedBooks = book.relatedBooks.filter(b => b.id !== book.id).slice(0, 4);
            const isFav = store.isWishlisted(book.id);
            const soldOut = book.stock <= 0;
            const placeholder = `this.onerror=null; this.src=app.getBookPlaceholder(this.alt, '');`;

            container.innerHTML = `
                <div class="container py-4">
                    <!-- Breadcrumbs -->
                    <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                        <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                        <span>/</span>
                        <a href="#/catalog?category=${book.categoryId}">${esc(book.categoryName)}</a>
                        <span>/</span>
                        <span class="text-main font-semibold text-truncate" style="max-width: 300px;">${esc(book.title)}</span>
                    </div>

                    <!-- Book Detail Showcase Grid -->
                    <div class="book-detail-grid">
                        <!-- Left: Gallery -->
                        <div class="book-detail-gallery">
                            <div class="detail-main-img-box">
                                <img src="${esc(book.coverImage)}" alt="${esc(book.title)}" class="detail-main-img" id="detail-active-img" onerror="${placeholder}">
                            </div>
                        </div>

                        <!-- Right: Metadata & Actions -->
                        <div class="book-detail-meta">
                            <div class="d-flex items-center gap-2 mb-2">
                                ${book.categories.map(c => `<a href="#/catalog?category=${c.id}" class="badge badge-primary font-bold">${esc(c.name)}</a>`).join('')}
                                ${book.isNew ? `<span class="badge badge-success">Mới Phát Hành</span>` : ''}
                            </div>

                            <h1 class="book-detail-title">${esc(book.title)}</h1>

                            <div class="book-meta-inline-info">
                                <div><i class="fa-solid fa-feather text-primary mr-1"></i> Tác giả: <strong>${esc(book.authorName)}</strong></div>
                                <div><i class="fa-solid fa-building text-primary mr-1"></i> NXB: <strong>${esc(book.publisherName || 'Đang cập nhật')}</strong></div>
                                <div><i class="fa-solid fa-calendar text-primary mr-1"></i> Năm XB: <strong>${book.publishYear || 'Đang cập nhật'}</strong></div>
                                <div class="d-flex items-center gap-1">
                                    <div class="star-rating">
                                        <i class="fa-solid fa-star"></i>
                                        <span class="font-bold text-sm ml-1">${book.reviewCount ? book.rating.toFixed(1) : 'Chưa có'}</span>
                                    </div>
                                    <span class="text-xs text-muted">(${book.reviewCount} đánh giá • đã bán ${book.soldCount})</span>
                                </div>
                            </div>

                            <!-- Price Box -->
                            <div class="book-detail-price-box">
                                <span class="detail-current-price">${store.formatCurrency(book.price)}</span>
                                ${book.originalPrice ? `
                                    <span class="detail-original-price">${store.formatCurrency(book.originalPrice)}</span>
                                    <span class="badge badge-danger">-${book.discountPercent}%</span>
                                    <span class="text-xs text-success font-semibold">Tiết kiệm ${store.formatCurrency(book.originalPrice - book.price)}</span>
                                ` : ''}
                            </div>

                            <!-- Purchase Actions -->
                            <div class="d-flex flex-column gap-3 mb-6">
                                <div class="d-flex items-center gap-3">
                                    <span class="font-bold text-sm">Số Lượng:</span>
                                    <div class="quantity-spinner">
                                        <button class="qty-btn" onclick="bookDetailPage.changeQty(-1)" ${soldOut ? 'disabled' : ''}>-</button>
                                        <input type="number" id="detail-book-qty" class="qty-input" value="${soldOut ? 0 : 1}" min="1" max="${book.stock}" ${soldOut ? 'disabled' : ''}>
                                        <button class="qty-btn" onclick="bookDetailPage.changeQty(1, ${book.stock})" ${soldOut ? 'disabled' : ''}>+</button>
                                    </div>
                                    <span class="text-xs ${soldOut ? 'text-danger font-bold' : 'text-muted'}">${soldOut ? 'Tạm hết hàng' : `(${book.stock} cuốn có sẵn trong kho)`}</span>
                                </div>

                                <div class="d-flex items-center gap-3 pt-2">
                                    <button class="btn btn-outline-primary btn-lg flex-1" onclick="bookDetailPage.addToCart('${book.id}')" ${soldOut ? 'disabled' : ''}>
                                        <i class="fa-solid fa-cart-plus mr-1"></i> Thêm Vào Giỏ Hàng
                                    </button>
                                    <button class="btn btn-primary btn-lg flex-1" onclick="bookDetailPage.buyNow('${book.id}')" ${soldOut ? 'disabled' : ''}>
                                        <i class="fa-solid fa-bolt mr-1"></i> Mua Ngay
                                    </button>
                                    <button class="icon-btn ${isFav ? 'text-danger' : ''}" style="width: 48px; height: 48px;"
                                            title="Thêm vào yêu thích" onclick="app.toggleWishlist('${book.id}', this)">
                                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-lg"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Quick Guarantee Badges -->
                            <div class="d-flex items-center gap-4 text-xs text-muted pt-3" style="border-top: 1px solid var(--border-subtle);">
                                <span><i class="fa-solid fa-truck-fast text-primary mr-1"></i> Miễn phí ship từ 300K</span>
                                <span><i class="fa-solid fa-rotate-left text-success mr-1"></i> Đổi trả 7 ngày</span>
                                <span><i class="fa-solid fa-shield-halved text-info mr-1"></i> 100% Chính hãng</span>
                            </div>
                        </div>
                    </div>

                    <!-- Book Information Tabs & Reviews -->
                    <div class="book-info-tabs-container mb-8" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2rem;">
                        <div class="nav-tabs">
                            <button class="tab-btn active" onclick="bookDetailPage.switchTab('desc', this)"><i class="fa-solid fa-align-left mr-1"></i> Mô Tả Chi Tiết</button>
                            <button class="tab-btn" onclick="bookDetailPage.switchTab('specs', this)"><i class="fa-solid fa-list-check mr-1"></i> Thông Số Kỹ Thuật</button>
                            <button class="tab-btn" onclick="bookDetailPage.switchTab('reviews', this)"><i class="fa-solid fa-star-half-stroke mr-1"></i> Đánh Giá (${summary.total})</button>
                        </div>

                        <div id="tab-desc" class="tab-pane active">
                            <div class="text-main leading-relaxed" style="font-size: 0.9375rem; line-height: 1.8; white-space: pre-line;">${book.description ? esc(book.description) : 'Sách chưa có mô tả chi tiết.'}</div>
                        </div>

                        <div id="tab-specs" class="tab-pane d-none">
                            <table class="admin-data-table" style="max-width: 600px;">
                                <tbody>
                                    <tr><th style="width: 200px;">Tác Giả</th><td>${esc(book.authorName)}</td></tr>
                                    <tr><th>Nhà Xuất Bản</th><td>${esc(book.publisherName || 'Đang cập nhật')}</td></tr>
                                    <tr><th>Năm Xuất Bản</th><td>${book.publishYear || 'Đang cập nhật'}</td></tr>
                                    <tr><th>Số Trang</th><td>${book.pages ? `${book.pages} trang` : 'Đang cập nhật'}</td></tr>
                                    ${book.dimensions ? `<tr><th>Kích Thước</th><td>${esc(book.dimensions)}</td></tr>` : ''}
                                    ${book.weight ? `<tr><th>Trọng Lượng</th><td>${book.weight} g</td></tr>` : ''}
                                    <tr><th>Ngôn Ngữ</th><td>${esc(book.language)}</td></tr>
                                    <tr><th>Mã ISBN</th><td>${esc(book.isbn || 'N/A')}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div id="tab-reviews" class="tab-pane d-none">
                            <div class="review-stats-summary">
                                <div class="text-center">
                                    <div class="rating-score-huge">${summary.total ? summary.average.toFixed(1) : '–'}</div>
                                    <div class="star-rating mb-1">
                                        ${[1, 2, 3, 4, 5].map(i => `<i class="fa-solid fa-star" style="${i <= Math.round(summary.average) ? '' : 'opacity:.25'}"></i>`).join('')}
                                    </div>
                                    <div class="text-xs text-muted">${summary.total} lượt đánh giá</div>
                                </div>
                                <div class="rating-bars-list">
                                    ${[5, 4, 3, 2, 1].map(star => {
                                        const count = num(summary.starCounts[star]);
                                        const pct = summary.total ? Math.round(count * 100 / summary.total) : 0;
                                        return `
                                    <div class="rating-bar-row">
                                        <span>${star} ★</span>
                                        <div class="bar-track"><div class="bar-fill" style="width: ${pct}%;"></div></div>
                                        <span>${count}</span>
                                    </div>`;
                                    }).join('')}
                                </div>
                            </div>

                            <!-- Write Review Box -->
                            <div class="p-4 rounded-lg mb-6" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                <h4 class="font-bold text-sm mb-2">Để Lại Đánh Giá Của Bạn</h4>
                                <div class="d-flex items-center gap-2 mb-3">
                                    <span class="text-xs text-muted font-semibold">Chấm điểm:</span>
                                    <div class="star-rating-interactive" id="review-stars-selector">
                                        ${[1, 2, 3, 4, 5].map(v => `<i class="fa-solid fa-star selected" data-val="${v}" onclick="bookDetailPage.setRating(${v})"></i>`).join('')}
                                    </div>
                                </div>
                                <div class="form-group mb-2">
                                    <textarea id="review-comment-input" class="form-textarea" rows="3" placeholder="Chia sẻ cảm nhận chân thật của bạn về cuốn sách này nhé..."></textarea>
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="bookDetailPage.submitReview('${book.id}')">
                                    <i class="fa-solid fa-paper-plane mr-1"></i> Gửi Đánh Giá
                                </button>
                            </div>

                            <div class="reviews-list" id="book-reviews-list">${this.renderReviews(reviews)}</div>
                        </div>
                    </div>

                    ${relatedBooks.length > 0 ? `
                        <div class="related-books-section">
                            <div class="section-header">
                                <div class="section-title-wrap">
                                    <h2><span class="section-icon-badge"><i class="fa-solid fa-book-bookmark"></i></span> Tác Phẩm Liên Quan</h2>
                                    <p>Có thể bạn cũng sẽ thích những tựa sách này</p>
                                </div>
                            </div>
                            <div class="book-grid">
                                ${relatedBooks.map(b => homePage.renderBookCard(b)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } catch (err) {
            if (!stillHere()) return;
            container.innerHTML = `<div class="container py-12 text-center text-danger"><h3>${esc(err.message)}</h3><a href="#/catalog" class="btn btn-primary mt-3">Quay lại danh mục</a></div>`;
        }
    },

    renderReviews(reviews) {
        if (!reviews.length) return '<p class="text-sm text-muted text-center py-4">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</p>';
        return reviews.map(r => `
            <div class="review-item-card">
                <div class="reviewer-avatar">${esc(r.userName.charAt(0))}</div>
                <div class="flex-1">
                    <div class="d-flex items-center justify-between mb-1">
                        <div class="font-bold text-sm">${esc(r.userName)} ${r.verified ? '<span class="badge badge-success text-xs">Đã mua hàng</span>' : ''}</div>
                        <div class="text-xs text-muted">${store.formatDate(r.date)}</div>
                    </div>
                    <div class="star-rating mb-2">
                        ${Array.from({ length: r.rating }).map(() => `<i class="fa-solid fa-star"></i>`).join('')}
                    </div>
                    ${r.title ? `<div class="font-semibold text-sm mb-1">${esc(r.title)}</div>` : ''}
                    <p class="text-sm text-muted">${esc(r.comment)}</p>
                </div>
            </div>
        `).join('');
    },

    changeQty(delta, max = 99) {
        const input = document.getElementById('detail-book-qty');
        let current = parseInt(input.value) || 1;
        current += delta;
        if (current < 1) current = 1;
        if (current > max) current = max;
        input.value = current;
    },

    currentQty() {
        return Math.max(1, parseInt(document.getElementById('detail-book-qty').value) || 1);
    },

    async addToCart(bookId) {
        return app.addToCart(bookId, this.currentQty());
    },

    async buyNow(bookId) {
        if (await this.addToCart(bookId)) app.navigate('#/checkout');
    },

    switchTab(tabName, btnElement) {
        document.querySelectorAll('.nav-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');

        ['desc', 'specs', 'reviews'].forEach(t => document.getElementById(`tab-${t}`).classList.add('d-none'));
        document.getElementById(`tab-${tabName}`).classList.remove('d-none');
    },

    setRating(val) {
        this.selectedRating = val;
        document.querySelectorAll('#review-stars-selector i').forEach((s, idx) => {
            s.classList.toggle('selected', idx < val);
        });
    },

    async submitReview(bookId) {
        if (!app.requireLogin('Vui lòng đăng nhập để đánh giá sách.')) return;
        const commentInput = document.getElementById('review-comment-input');
        const comment = commentInput.value.trim();

        if (!comment) {
            appToast.warning('Vui lòng nhập nội dung đánh giá của bạn!', 'Lưu Ý');
            return;
        }

        try {
            await ApiService.reviews.create(bookId, this.selectedRating, undefined, comment);
            appToast.success('Cảm ơn bạn đã gửi đánh giá cuốn sách!', 'Đánh Giá');
            this.render(document.getElementById('main-view'), bookId).then(() => {
                const tab = document.querySelector('.nav-tabs .tab-btn:nth-child(3)');
                if (tab) this.switchTab('reviews', tab);
            });
        } catch (err) {
            appToast.error(err.message || 'Lỗi gửi đánh giá.');
        }
    }
};
