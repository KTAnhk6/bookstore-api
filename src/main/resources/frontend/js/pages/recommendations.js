/**
 * PERSONALIZED RECOMMENDATIONS PAGE CONTROLLER (Trang đề xuất dựa theo sở thích)
 * Shows curated books strictly matching the user's 5 selected favorite genres.
 */

const recommendationsPage = {
    async render(container) {
        if (!app.requireLogin('Vui lòng đăng nhập để xem sách đề xuất theo sở thích!')) return;

        const stillHere = app.routeChecker();
        container.innerHTML = `
            <div class="container py-12 text-center">
                <div class="spinner-ring" style="margin: 0 auto;"></div>
                <p class="mt-3 text-muted">Đang phân tích 5 thể loại yêu thích và tuyển chọn sách phù hợp nhất cho bạn...</p>
            </div>
        `;

        // Đảm bảo nạp đầy đủ danh mục và sở thích của user
        let categories = store.getCategories() || [];
        if (categories.length === 0) {
            try {
                await store.reloadCategories();
                categories = store.getCategories() || [];
            } catch (e) {
                console.warn('Không tải được danh mục:', e);
            }
        }

        let favoriteCategoryIds = (store.getFavoriteCategories() || []).map(String);
        if (favoriteCategoryIds.length === 0) {
            try {
                const favCats = await ApiService.users.favoriteCategories();
                if (favCats && favCats.length > 0) {
                    store.favoriteCategoryIds = favCats.map(c => String(c.id));
                    favoriteCategoryIds = store.favoriteCategoryIds;
                }
            } catch (e) {
                console.warn('Chưa lấy được sở thích:', e);
            }
        }

        let recommendedBooks = [];
        try {
            recommendedBooks = await ApiService.recommendations.forMe(12);
            store.cacheBooks(recommendedBooks);
        } catch (err) {
            if (stillHere()) app.showError(err);
            return;
        }
        if (!stillHere()) return;

        const favoriteCategories = categories.filter(c => favoriteCategoryIds.includes(String(c.id)));

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Đề Xuất Dành Riêng Cho Bạn</span>
                </div>

                <!-- Recommendation Hero Callout Banner -->
                <div class="p-6 rounded-xl mb-8" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%); color: #ffffff; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
                    <div class="d-flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <span class="badge badge-accent mb-2" style="background: #fef08a; color: #1e1b4b; font-weight: 700;">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i> AI Gợi Ý Cá Nhân Hóa
                            </span>
                            <h1 class="text-2xl font-bold mb-2 text-white">Tủ Sách Được Tuyển Chọn Dành Cho Bạn</h1>
                            <p class="text-sm" style="color: #cbd5e1; max-width: 620px;">
                                Thuật toán thông minh tự động phân tích và chọn lọc các tựa sách hay nhất dựa trên 5 chủ đề bạn yêu thích.
                            </p>
                        </div>
                        <button class="btn btn-outline-light" onclick="favoriteGenresModal.open()" style="font-weight: 700; border-width: 2px;">
                            <i class="fa-solid fa-sliders mr-2"></i> Tuỳ Chỉnh 5 Sở Thích
                        </button>
                    </div>

                    <!-- Selected 5 genres tags -->
                    <div class="d-flex items-center gap-2 mt-4 flex-wrap pt-3" style="border-top: 1px solid rgba(255,255,255,0.18);">
                        <span class="text-xs" style="color: #fef08a !important; font-weight: 700;">5 Sở thích đang chọn:</span>
                        ${favoriteCategories.length > 0 ? favoriteCategories.map(c => `
                            <span class="badge" style="background: rgba(255, 255, 255, 0.2); color: #ffffff; backdrop-filter: blur(4px); font-size: 0.8rem; padding: 0.35rem 0.75rem;">
                                <i class="${esc(c.icon || 'fa-solid fa-book')} mr-1"></i> ${esc(c.name)}
                            </span>
                        `).join('') : '<span class="text-xs" style="color: #cbd5e1;">Chưa chọn thể loại nào. Bấm "Tuỳ Chỉnh 5 Sở Thích" để nhận gợi ý chính xác nhất.</span>'}
                    </div>
                </div>

                <!-- Recommended Books Section Header & Action Bar -->
                <div class="section-header d-flex justify-between items-center flex-wrap gap-3 mb-4">
                    <div class="section-title-wrap">
                        <h2>
                            <span class="section-icon-badge" style="background: #fef3c7; color: #d97706;">
                                <i class="fa-solid fa-sparkles"></i>
                            </span>
                            Danh Sách Sách Phù Hợp Nhất
                        </h2>
                        <p>Các tác phẩm được đánh giá cao và bán chạy nhất trong các thể loại bạn theo dõi</p>
                    </div>
                    <div class="d-flex items-center gap-2">
                        <span class="badge badge-subtle" style="font-weight: 600;">${recommendedBooks.length} cuốn gợi ý</span>
                        <button class="btn btn-sm btn-outline-primary" onclick="favoriteGenresModal.open()">
                            <i class="fa-solid fa-sliders mr-1"></i> Thay Đổi Sở Thích
                        </button>
                    </div>
                </div>

                <!-- Recommended Books Grid -->
                ${recommendedBooks.length > 0 ? `
                    <div class="book-grid">
                        ${recommendedBooks.map(b => homePage.renderBookCard(b)).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12" style="background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px dashed var(--border-color); padding: 3rem 1.5rem;">
                        <i class="fa-solid fa-book-sparkles text-4xl text-primary mb-3"></i>
                        <h3 class="text-lg font-bold mb-2">Chưa tìm thấy sách phù hợp với các thể loại đã chọn</h3>
                        <p class="text-muted text-sm mb-4">Hãy chọn hoặc thay đổi 5 thể loại bạn yêu thích để hệ thống tuyển chọn các tựa sách hay nhất.</p>
                        <button class="btn btn-primary" onclick="favoriteGenresModal.open()">
                            <i class="fa-solid fa-sliders mr-1"></i> Chọn 5 Thể Loại Ngay
                        </button>
                    </div>
                `}
            </div>
        `;
    }
};
