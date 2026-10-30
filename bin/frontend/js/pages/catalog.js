/**
 * BOOK CATALOG & MULTI-FACET SEARCH / FILTER PAGE
 * Multi-criteria filters (Categories, Authors, Publishers, Price, Rating),
 * live search keywords, sorting, pagination, and Grid/List view toggle.
 */

const catalogPage = {
    filters: {
        keyword: '',
        category: '',
        authorId: '',
        publisherId: '',
        minPrice: null,
        maxPrice: null,
        rating: null,
        sort: 'bestseller',
        viewMode: 'grid'
    },

    async render(container, queryParams = {}) {
        // Read URL query params
        this.filters.keyword = queryParams.keyword || '';
        this.filters.category = queryParams.category || '';
        this.filters.sort = queryParams.sort || 'bestseller';

        const categories = store.getCategories();
        const authors = store.getAuthors();
        const publishers = store.getPublishers();

        container.innerHTML = `
            <div class="container py-4">
                <!-- Breadcrumbs -->
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Danh Mục Sách</span>
                    ${this.filters.keyword ? `<span>/</span> <span>Tìm kiếm: "${this.filters.keyword}"</span>` : ''}
                </div>

                <div class="catalog-layout">
                    <!-- Sidebar Filters -->
                    <aside class="catalog-sidebar">
                        <div class="d-flex items-center justify-between pb-3 mb-3" style="border-bottom: 1px solid var(--border-color);">
                            <h3 class="font-bold text-base d-flex items-center gap-2">
                                <i class="fa-solid fa-filter text-primary"></i> Bộ Lọc Tìm Kiếm
                            </h3>
                            <button class="btn btn-xs btn-ghost text-primary" onclick="catalogPage.resetFilters()">
                                Xoá tất cả
                            </button>
                        </div>

                        <!-- Filter: Categories -->
                        <div class="filter-group">
                            <div class="filter-header">
                                <span>Thể Loại Sách</span>
                            </div>
                            <div class="filter-options-list">
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="cat-filter" value="" ${!this.filters.category ? 'checked' : ''} onchange="catalogPage.setFilter('category', '')">
                                        <span>Tất cả thể loại</span>
                                    </div>
                                </label>
                                ${categories.map(c => `
                                    <label class="filter-checkbox-item">
                                        <div class="d-flex items-center">
                                            <input type="radio" name="cat-filter" value="${c.id}" ${this.filters.category === c.id ? 'checked' : ''} onchange="catalogPage.setFilter('category', '${c.id}')">
                                            <span>${c.name}</span>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Filter: Authors -->
                        <div class="filter-group">
                            <div class="filter-header">
                                <span>Tác Giả Nổi Tiếng</span>
                            </div>
                            <div class="filter-options-list">
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="author-filter" value="" ${!this.filters.authorId ? 'checked' : ''} onchange="catalogPage.setFilter('authorId', '')">
                                        <span>Tất cả tác giả</span>
                                    </div>
                                </label>
                                ${authors.map(a => `
                                    <label class="filter-checkbox-item">
                                        <div class="d-flex items-center">
                                            <input type="radio" name="author-filter" value="${a.id}" ${this.filters.authorId === a.id ? 'checked' : ''} onchange="catalogPage.setFilter('authorId', '${a.id}')">
                                            <span>${a.name}</span>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Filter: Publishers -->
                        <div class="filter-group">
                            <div class="filter-header">
                                <span>Nhà Xuất Bản</span>
                            </div>
                            <div class="filter-options-list">
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="pub-filter" value="" ${!this.filters.publisherId ? 'checked' : ''} onchange="catalogPage.setFilter('publisherId', '')">
                                        <span>Tất cả NXB</span>
                                    </div>
                                </label>
                                ${publishers.map(p => `
                                    <label class="filter-checkbox-item">
                                        <div class="d-flex items-center">
                                            <input type="radio" name="pub-filter" value="${p.id}" ${this.filters.publisherId === p.id ? 'checked' : ''} onchange="catalogPage.setFilter('publisherId', '${p.id}')">
                                            <span>${p.name}</span>
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Filter: Price Range -->
                        <div class="filter-group">
                            <div class="filter-header">
                                <span>Khoảng Giá</span>
                            </div>
                            <div class="filter-options-list">
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="price-filter" value="all" checked onchange="catalogPage.setPriceRange(null, null)">
                                        <span>Tất cả mức giá</span>
                                    </div>
                                </label>
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="price-filter" value="0-150" onchange="catalogPage.setPriceRange(0, 150000)">
                                        <span>Dưới 150.000 ₫</span>
                                    </div>
                                </label>
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="price-filter" value="150-250" onchange="catalogPage.setPriceRange(150000, 250000)">
                                        <span>150.000 ₫ - 250.000 ₫</span>
                                    </div>
                                </label>
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="price-filter" value="250+" onchange="catalogPage.setPriceRange(250000, 1000000)">
                                        <span>Trên 250.000 ₫</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Filter: Rating -->
                        <div class="filter-group">
                            <div class="filter-header">
                                <span>Đánh Giá Sao</span>
                            </div>
                            <div class="filter-options-list">
                                <label class="filter-checkbox-item">
                                    <div class="d-flex items-center">
                                        <input type="radio" name="rating-filter" value="4.8" onchange="catalogPage.setFilter('rating', 4.8)">
                                        <div class="star-rating ml-1">
                                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                                            <span class="text-xs text-muted ml-1">Từ 4.8 sao</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </aside>

                    <!-- Catalog Main Area -->
                    <main class="catalog-main">
                        <!-- Toolbar -->
                        <div class="catalog-toolbar">
                            <div class="d-flex items-center gap-2">
                                <span class="font-bold text-sm" id="catalog-count-text">Đang tải danh sách...</span>
                            </div>
                            <div class="d-flex items-center gap-3">
                                <div class="d-flex items-center gap-2">
                                    <span class="text-xs text-muted font-semibold">Sắp xếp:</span>
                                    <select class="form-select form-select-sm" style="width: auto; padding: 0.35rem 0.75rem;" 
                                            onchange="catalogPage.setFilter('sort', this.value)">
                                        <option value="bestseller" ${this.filters.sort === 'bestseller' ? 'selected' : ''}>Bán Chạy Nhất</option>
                                        <option value="new" ${this.filters.sort === 'new' ? 'selected' : ''}>Mới Nhất</option>
                                        <option value="price-asc" ${this.filters.sort === 'price-asc' ? 'selected' : ''}>Giá: Thấp đến Cao</option>
                                        <option value="price-desc" ${this.filters.sort === 'price-desc' ? 'selected' : ''}>Giá: Cao đến Thấp</option>
                                        <option value="rating" ${this.filters.sort === 'rating' ? 'selected' : ''}>Đánh Giá Cao Nhất</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Active Filter Chips -->
                        <div class="active-filters-chips" id="active-filter-chips"></div>

                        <!-- Books Grid -->
                        <div class="book-grid" id="catalog-books-grid">
                            <!-- Injected by fetchAndRenderBooks -->
                        </div>
                    </main>
                </div>
            </div>
        `;

        await this.fetchAndRenderBooks();
    },

    async fetchAndRenderBooks() {
        const grid = document.getElementById('catalog-books-grid');
        const countText = document.getElementById('catalog-count-text');
        const chipsContainer = document.getElementById('active-filter-chips');
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-span-full py-12 text-center">
                <div class="spinner-ring"></div>
                <p class="mt-2 text-muted text-sm">Đang tải danh sách sách...</p>
            </div>
        `;

        try {
            const books = await ApiService.books.getAll(this.filters);
            if (countText) countText.textContent = `Tìm thấy ${books.length} tác phẩm`;

            // Render chips
            this.renderChips(chipsContainer);

            if (books.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full py-12 text-center" style="grid-column: 1 / -1; background: var(--bg-surface); border-radius: var(--radius-lg); padding: 3rem;">
                        <i class="fa-solid fa-book-open-reader text-muted mb-3" style="font-size: 3rem;"></i>
                        <h3 class="font-bold text-lg mb-1">Không tìm thấy cuốn sách nào phù hợp</h3>
                        <p class="text-sm text-muted mb-4">Hãy thử xoá bớt các điều kiện lọc hoặc tìm kiếm với từ khoá khác.</p>
                        <button class="btn btn-primary btn-sm" onclick="catalogPage.resetFilters()">
                            <i class="fa-solid fa-rotate-left mr-1"></i> Xoá Bộ Lọc
                        </button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = books.map(b => homePage.renderBookCard(b)).join('');
        } catch (err) {
            grid.innerHTML = `<div class="p-4 text-danger text-center">Lỗi tải dữ liệu: ${err.message}</div>`;
        }
    },

    renderChips(container) {
        if (!container) return;
        const chips = [];

        if (this.filters.keyword) {
            chips.push(`Từ khoá: "${this.filters.keyword}" <i class="fa-solid fa-xmark filter-chip-remove" onclick="catalogPage.setFilter('keyword', '')"></i>`);
        }
        if (this.filters.category) {
            const cat = store.getCategories().find(c => c.id === this.filters.category);
            chips.push(`Thể loại: ${cat ? cat.name : this.filters.category} <i class="fa-solid fa-xmark filter-chip-remove" onclick="catalogPage.setFilter('category', '')"></i>`);
        }
        if (this.filters.authorId) {
            const auth = store.getAuthors().find(a => a.id === this.filters.authorId);
            chips.push(`Tác giả: ${auth ? auth.name : ''} <i class="fa-solid fa-xmark filter-chip-remove" onclick="catalogPage.setFilter('authorId', '')"></i>`);
        }
        if (this.filters.publisherId) {
            const pub = store.getPublishers().find(p => p.id === this.filters.publisherId);
            chips.push(`NXB: ${pub ? pub.name : ''} <i class="fa-solid fa-xmark filter-chip-remove" onclick="catalogPage.setFilter('publisherId', '')"></i>`);
        }
        if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
            chips.push(`Giá lọc <i class="fa-solid fa-xmark filter-chip-remove" onclick="catalogPage.setPriceRange(null, null)"></i>`);
        }

        container.innerHTML = chips.map(c => `<span class="filter-chip">${c}</span>`).join('');
    },

    setFilter(key, value) {
        this.filters[key] = value;
        this.fetchAndRenderBooks();
    },

    setPriceRange(min, max) {
        this.filters.minPrice = min;
        this.filters.maxPrice = max;
        this.fetchAndRenderBooks();
    },

    resetFilters() {
        this.filters = {
            keyword: '',
            category: '',
            authorId: '',
            publisherId: '',
            minPrice: null,
            maxPrice: null,
            rating: null,
            sort: 'bestseller',
            viewMode: 'grid'
        };

        // Reset radio buttons in DOM
        document.querySelectorAll('.catalog-sidebar input[type="radio"]').forEach(r => {
            if (r.value === '' || r.value === 'all') r.checked = true;
        });

        this.fetchAndRenderBooks();
    }
};
