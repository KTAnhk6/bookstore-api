/**
 * BOOK DETAIL PAGE CONTROLLER
 * Full view with photo gallery, book metadata, reviews with interactive stars,
 * tabs for description/specs, and related books slider.
 */

const bookDetailPage = {
    selectedRating: 5,

    async render(container, bookId) {
        try {
            const book = await ApiService.books.getById(bookId);
            const reviews = await ApiService.reviews.getByBookId(bookId);
            const relatedBooks = store.getBooks().filter(b => b.id !== book.id && (b.categoryId === book.categoryId || b.authorId === book.authorId)).slice(0, 4);
            const isFav = store.isWishlisted(book.id);

            container.innerHTML = `
                <div class="container py-4">
                    <!-- Breadcrumbs -->
                    <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                        <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                        <span>/</span>
                        <a href="#/catalog?category=${book.categoryId}">${book.categoryName}</a>
                        <span>/</span>
                        <span class="text-main font-semibold text-truncate" style="max-width: 300px;">${book.title}</span>
                    </div>

                    <!-- Book Detail Showcase Grid -->
                    <div class="book-detail-grid">
                        <!-- Left: Gallery -->
                        <div class="book-detail-gallery">
                            <div class="detail-main-img-box">
                                <img src="${book.coverImage}" alt="${book.title}" class="detail-main-img" id="detail-active-img" onerror="this.onerror=null; this.src=app.getBookPlaceholder('${book.title}', '${book.categoryName}');">
                            </div>
                            <div class="detail-thumbnails-row">
                                ${(book.gallery && book.gallery.length ? book.gallery : [book.coverImage]).map((img, idx) => `
                                    <div class="detail-thumb ${idx === 0 ? 'active' : ''}" onclick="bookDetailPage.changePreviewImage('${img}', this)">
                                        <img src="${img}" alt="Thumbnail" onerror="this.onerror=null; this.src=app.getBookPlaceholder('${book.title}', '${book.categoryName}');">
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Right: Metadata & Actions -->
                        <div class="book-detail-meta">
                            <div class="d-flex items-center gap-2 mb-2">
                                <span class="badge badge-primary font-bold">${book.categoryName}</span>
                                ${book.isBestseller ? `<span class="badge badge-accent"><i class="fa-solid fa-fire"></i> Bestseller</span>` : ''}
                                ${book.isNew ? `<span class="badge badge-success">Mới Phát Hành</span>` : ''}
                            </div>

                            <h1 class="book-detail-title">${book.title}</h1>

                            <div class="book-meta-inline-info">
                                <div><i class="fa-solid fa-feather text-primary mr-1"></i> Tác giả: <strong>${book.authorName}</strong></div>
                                <div><i class="fa-solid fa-building text-primary mr-1"></i> NXB: <strong>${book.publisherName}</strong></div>
                                <div><i class="fa-solid fa-calendar text-primary mr-1"></i> Năm XB: <strong>${book.publishYear || 2024}</strong></div>
                                <div class="d-flex items-center gap-1">
                                    <div class="star-rating">
                                        <i class="fa-solid fa-star"></i>
                                        <span class="font-bold text-sm ml-1">${book.rating}</span>
                                    </div>
                                    <span class="text-xs text-muted">(${book.reviewCount} đánh giá)</span>
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

                            <!-- Highlights -->
                            ${book.highlight ? `
                                <div class="p-3 mb-4 rounded-lg" style="background: var(--bg-subtle); border-left: 4px solid var(--primary); font-size: 0.875rem;">
                                    <i class="fa-solid fa-quote-left text-primary mr-1"></i> <em>${book.highlight}</em>
                                </div>
                            ` : ''}

                            <!-- Purchase Actions -->
                            <div class="d-flex flex-column gap-3 mb-6">
                                <div class="d-flex items-center gap-3">
                                    <span class="font-bold text-sm">Số Lượng:</span>
                                    <div class="quantity-spinner">
                                        <button class="qty-btn" onclick="bookDetailPage.changeQty(-1)">-</button>
                                        <input type="number" id="detail-book-qty" class="qty-input" value="1" min="1" max="${book.stock}">
                                        <button class="qty-btn" onclick="bookDetailPage.changeQty(1, ${book.stock})">+</button>
                                    </div>
                                    <span class="text-xs text-muted">(${book.stock} cuốn có sẵn trong kho)</span>
                                </div>

                                <div class="d-flex items-center gap-3 pt-2">
                                    <button class="btn btn-outline-primary btn-lg flex-1" onclick="bookDetailPage.addToCart('${book.id}')">
                                        <i class="fa-solid fa-cart-plus mr-1"></i> Thêm Vào Giỏ Hàng
                                    </button>
                                    <button class="btn btn-primary btn-lg flex-1" onclick="bookDetailPage.buyNow('${book.id}')">
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
                                <span><i class="fa-solid fa-truck-fast text-primary mr-1"></i> Giao nhanh 2h</span>
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
                            <button class="tab-btn" onclick="bookDetailPage.switchTab('reviews', this)"><i class="fa-solid fa-star-half-stroke mr-1"></i> Đánh Giá (${reviews.length})</button>
                        </div>

                        <!-- Tab 1: Description -->
                        <div id="tab-desc" class="tab-pane active">
                            <div class="text-main leading-relaxed" style="font-size: 0.9375rem; line-height: 1.8;">
                                <p class="mb-4">${book.description}</p>
                                <h4 class="font-bold text-base mb-2">Vì sao bạn nên đọc cuốn sách này?</h4>
                                <ul style="list-style: disc; margin-left: 1.5rem; margin-bottom: 1rem; color: var(--text-muted);">
                                    <li>Tư duy giải quyết vấn đề thực tế từ chuyên gia đầu ngành.</li>
                                    <li>Được biên soạn công phu với minh hoạ trực quan, ngôn từ gần gũi.</li>
                                    <li>Bản quyền chính thức chất lượng cao từ ${book.publisherName}.</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Tab 2: Specs -->
                        <div id="tab-specs" class="tab-pane d-none">
                            <table class="admin-data-table" style="max-width: 600px;">
                                <tbody>
                                    <tr><th style="width: 200px;">Tác Giả</th><td>${book.authorName}</td></tr>
                                    <tr><th>Nhà Xuất Bản</th><td>${book.publisherName}</td></tr>
                                    <tr><th>Năm Xuất Bản</th><td>${book.publishYear || 2024}</td></tr>
                                    <tr><th>Số Trang</th><td>${book.pages || 'Đang cập nhật'} trang</td></tr>
                                    <tr><th>Hình Thức</th><td>${book.format || 'Bìa Mềm'}</td></tr>
                                    <tr><th>Ngôn Ngữ</th><td>${book.language || 'Tiếng Việt'}</td></tr>
                                    <tr><th>Mã ISBN</th><td>${book.isbn || 'N/A'}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Tab 3: Reviews & Rating Form -->
                        <div id="tab-reviews" class="tab-pane d-none">
                            <div class="review-stats-summary">
                                <div class="text-center">
                                    <div class="rating-score-huge">${book.rating}</div>
                                    <div class="star-rating mb-1">
                                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                                    </div>
                                    <div class="text-xs text-muted">${book.reviewCount} lượt đánh giá</div>
                                </div>
                                <div class="rating-bars-list">
                                    <div class="rating-bar-row">
                                        <span>5 ★</span>
                                        <div class="bar-track"><div class="bar-fill" style="width: 85%;"></div></div>
                                        <span>85%</span>
                                    </div>
                                    <div class="rating-bar-row">
                                        <span>4 ★</span>
                                        <div class="bar-track"><div class="bar-fill" style="width: 12%;"></div></div>
                                        <span>12%</span>
                                    </div>
                                    <div class="rating-bar-row">
                                        <span>3 ★</span>
                                        <div class="bar-track"><div class="bar-fill" style="width: 3%;"></div></div>
                                        <span>3%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Write Review Box -->
                            <div class="p-4 rounded-lg mb-6" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                <h4 class="font-bold text-sm mb-2">Để Lại Đánh Giá Của Bạn</h4>
                                <div class="d-flex items-center gap-2 mb-3">
                                    <span class="text-xs text-muted font-semibold">Chấm điểm:</span>
                                    <div class="star-rating-interactive" id="review-stars-selector">
                                        <i class="fa-solid fa-star selected" data-val="1" onclick="bookDetailPage.setRating(1)"></i>
                                        <i class="fa-solid fa-star selected" data-val="2" onclick="bookDetailPage.setRating(2)"></i>
                                        <i class="fa-solid fa-star selected" data-val="3" onclick="bookDetailPage.setRating(3)"></i>
                                        <i class="fa-solid fa-star selected" data-val="4" onclick="bookDetailPage.setRating(4)"></i>
                                        <i class="fa-solid fa-star selected" data-val="5" onclick="bookDetailPage.setRating(5)"></i>
                                    </div>
                                </div>
                                <div class="form-group mb-2">
                                    <textarea id="review-comment-input" class="form-textarea" rows="3" placeholder="Chia sẻ cảm nhận chân thật của bạn về cuốn sách này nhé..."></textarea>
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="bookDetailPage.submitReview('${book.id}')">
                                    <i class="fa-solid fa-paper-plane mr-1"></i> Gửi Đánh Giá
                                </button>
                            </div>

                            <!-- Reviews List -->
                            <div class="reviews-list" id="book-reviews-list">
                                ${reviews.map(r => `
                                    <div class="review-item-card">
                                        <div class="reviewer-avatar">${r.userName.charAt(0)}</div>
                                        <div class="flex-1">
                                            <div class="d-flex items-center justify-between mb-1">
                                                <div class="font-bold text-sm">${r.userName}</div>
                                                <div class="text-xs text-muted">${r.date}</div>
                                            </div>
                                            <div class="star-rating mb-2">
                                                ${Array.from({length: r.rating}).map(() => `<i class="fa-solid fa-star"></i>`).join('')}
                                            </div>
                                            <p class="text-sm text-muted">${r.comment}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Related Books -->
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
            container.innerHTML = `<div class="container py-12 text-center text-danger"><h3>Lỗi: ${err.message}</h3><a href="#/catalog" class="btn btn-primary mt-3">Quay lại danh mục</a></div>`;
        }
    },

    changePreviewImage(src, thumbElement) {
        document.getElementById('detail-active-img').src = src;
        document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
        if (thumbElement) thumbElement.classList.add('active');
    },

    changeQty(delta, max = 99) {
        const input = document.getElementById('detail-book-qty');
        let current = parseInt(input.value) || 1;
        current += delta;
        if (current < 1) current = 1;
        if (current > max) current = max;
        input.value = current;
    },

    addToCart(bookId) {
        const qty = parseInt(document.getElementById('detail-book-qty').value) || 1;
        const book = store.getBooks().find(b => b.id === bookId);
        if (book) {
            store.addToCart(book, qty);
            appToast.success(`Đã thêm ${qty} cuốn "${book.title}" vào giỏ hàng!`, 'Giỏ Hàng');
        }
    },

    buyNow(bookId) {
        this.addToCart(bookId);
        app.navigate('#/checkout');
    },

    switchTab(tabName, btnElement) {
        document.querySelectorAll('.nav-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');

        document.getElementById('tab-desc').classList.add('d-none');
        document.getElementById('tab-specs').classList.add('d-none');
        document.getElementById('tab-reviews').classList.add('d-none');

        document.getElementById(`tab-${tabName}`).classList.remove('d-none');
    },

    setRating(val) {
        this.selectedRating = val;
        const stars = document.querySelectorAll('#review-stars-selector i');
        stars.forEach((s, idx) => {
            if (idx < val) s.classList.add('selected');
            else s.classList.remove('selected');
        });
    },

    async submitReview(bookId) {
        const commentInput = document.getElementById('review-comment-input');
        const comment = commentInput.value.trim();

        if (!comment) {
            appToast.warning('Vui lòng nhập nội dung đánh giá của bạn!', 'Lưu Ý');
            return;
        }

        try {
            await ApiService.reviews.addReview(bookId, {
                rating: this.selectedRating,
                comment: comment
            });

            appToast.success('Cảm ơn bạn đã gửi đánh giá cuốn sách!', 'Đánh Giá');
            commentInput.value = '';
            
            // Refresh reviews
            const reviews = await ApiService.reviews.getByBookId(bookId);
            const listEl = document.getElementById('book-reviews-list');
            listEl.innerHTML = reviews.map(r => `
                <div class="review-item-card">
                    <div class="reviewer-avatar">${r.userName.charAt(0)}</div>
                    <div class="flex-1">
                        <div class="d-flex items-center justify-between mb-1">
                            <div class="font-bold text-sm">${r.userName}</div>
                            <div class="text-xs text-muted">${r.date}</div>
                        </div>
                        <div class="star-rating mb-2">
                            ${Array.from({length: r.rating}).map(() => `<i class="fa-solid fa-star"></i>`).join('')}
                        </div>
                        <p class="text-sm text-muted">${r.comment}</p>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            appToast.error(err.message || 'Lỗi gửi đánh giá.');
        }
    }
};
