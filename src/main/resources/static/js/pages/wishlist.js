/**
 * WISHLIST PAGE CONTROLLER (Trang Yêu Thích)
 * Displays all liked books with quick add to cart and removal options.
 */

const wishlistPage = {
    async render(container) {
        if (!app.requireLogin('Vui lòng đăng nhập để xem sách yêu thích!')) return;

        const stillHere = app.routeChecker();
        let wishlistedBooks = [];
        try {
            wishlistedBooks = await store.refreshWishlist();
        } catch (err) {
            if (stillHere()) app.showError(err);
            return;
        }
        if (!stillHere()) return;

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Danh Sách Yêu Thích</span>
                </div>

                <div class="d-flex items-center justify-between mb-6">
                    <div>
                        <h1 class="text-2xl font-bold d-flex items-center gap-2">
                            <i class="fa-solid fa-heart text-danger"></i> Sách Yêu Thích Của Bạn
                        </h1>
                        <p class="text-xs text-muted mt-1">Lưu trữ các cuốn sách bạn quan tâm để dễ dàng theo dõi và mua sắm sau này.</p>
                    </div>
                    <span class="badge badge-primary">${wishlistedBooks.length} cuốn</span>
                </div>

                ${wishlistedBooks.length === 0 ? `
                    <div class="py-12 text-center" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 4rem 2rem;">
                        <i class="fa-regular fa-heart text-muted mb-3" style="font-size: 3.5rem;"></i>
                        <h3 class="text-xl font-bold mb-2">Danh sách yêu thích đang trống</h3>
                        <p class="text-muted text-sm mb-6">Hãy bấm biểu tượng trái tim trên các cuốn sách để lưu vào đây nhé!</p>
                        <a href="#/catalog" class="btn btn-primary">
                            <i class="fa-solid fa-compass mr-1"></i> Khám Phá Kho Sách
                        </a>
                    </div>
                ` : `
                    <div class="book-grid">
                        ${wishlistedBooks.map(b => homePage.renderBookCard(b)).join('')}
                    </div>
                `}
            </div>
        `;
    }
};
