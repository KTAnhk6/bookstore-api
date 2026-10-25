/**
 * PERSONALIZED RECOMMENDATIONS PAGE CONTROLLER (Trang đề xuất dựa theo sở thích)
 * Shows curated books matching the user's 5 selected favorite genres.
 */

const recommendationsPage = {
    render(container) {
        const favoriteCategoryIds = store.getFavoriteCategories();
        const allCategories = store.getCategories();
        const favoriteCategories = allCategories.filter(c => favoriteCategoryIds.includes(c.id));
        const recommendedBooks = store.getRecommendedBooks();

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Đề Xuất Dành Riêng Cho Bạn</span>
                </div>

                <!-- Recommendation Hero Callout -->
                <div class="p-6 rounded-xl mb-8" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%); color: #ffffff; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
                    <div class="d-flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <span class="badge badge-accent mb-2"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Gợi Ý Cá Nhân Hóa</span>
                            <h1 class="text-2xl font-bold mb-2">Tủ Sách Được Tuyển Chọn Dành Cho Bạn</h1>
                            <p class="text-sm" style="color: #cbd5e1; max-width: 600px;">
                                Thuật toán thông minh tự động phân tích và chọn lọc các tựa sách hay nhất dựa trên 5 chủ đề bạn yêu thích.
                            </p>
                        </div>
                        <button class="btn btn-outline-light" onclick="favoriteGenresModal.open()">
                            <i class="fa-solid fa-sliders mr-1"></i> Tuỳ Chỉnh 5 Sở Thích
                        </button>
                    </div>

                    <!-- Selected 5 genres tags -->
                    <div class="d-flex items-center gap-2 mt-4 flex-wrap pt-3" style="border-top: 1px solid rgba(255,255,255,0.15);">
                        <span class="text-xs text-muted" style="color: #fef08a !important; font-weight: 700;">5 Sở thích đang chọn:</span>
                        ${favoriteCategories.map(c => `
                            <span class="badge" style="background: rgba(255, 255, 255, 0.2); color: #ffffff; backdrop-filter: blur(4px);">
                                <i class="${c.icon || 'fa-solid fa-book'} mr-1"></i> ${c.name}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- Recommended Books Grid -->
                <div class="section-header">
                    <div class="section-title-wrap">
                        <h2><span class="section-icon-badge" style="background: #fef3c7; color: #d97706;"><i class="fa-solid fa-sparkles"></i></span> Danh Sách Sách Phù Hợp Nhất</h2>
                        <p>Các tác phẩm được đánh giá cao nhất trong các thể loại bạn theo dõi</p>
                    </div>
                </div>

                <div class="book-grid">
                    ${recommendedBooks.map(b => homePage.renderBookCard(b)).join('')}
                </div>
            </div>
        `;
    }
};
