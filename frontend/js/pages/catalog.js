/**
 * BOOK CATALOG & MULTI-FACET SEARCH / FILTER PAGE
 * Lọc, sắp xếp và phân trang do backend xử lý (GET /api/books).
 */

const catalogPage = {
    PAGE_SIZE: 12,
    filters: {},
    page: 0,
    requestSeq: 0,

    defaultFilters() {
        return { keyword: '', category: '', authorId: '', publisherId: '', minPrice: null, maxPrice: null, rating: null, sort: 'newest' };
    },

    // `category` trong URL có thể là id hoặc slug
    resolveCategory(value) {
        if (!value) return '';
        const cat = store.getCategories().find(c => c.id === String(value) || c.slug === value);
        return cat ? cat.id : '';
    },

    async render(container, queryParams = {}) {
        this.filters = {
            ...this.defaultFilters(),
            keyword: queryParams.keyword || '',
            category: this.resolveCategory(queryParams.category),
            sort: queryParams.sort || 'newest'
        };
        this.page = 0;

        const categories = store.getCategories();
        const authors = store.getAuthors();
        const publishers = store.getPublishers();
        const radio = (name, value, label, checked, handler) => `
            <label class="filter-checkbox-item">
                <div class="d-flex items-center">
                    <input type="radio" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''} onchange="${handler}">
                    <span>${label}</span>
                </div>
            </label>`;
        const sorts = [['newest', 'Mới Nhất'], ['sales_desc', 'Bán Chạy Nhất'], ['price_asc', 'Giá: Thấp đến Cao'],
            ['price_desc', 'Giá: Cao đến Thấp'], ['rating', 'Đánh Giá Cao Nhất'], ['title_asc', 'Tên A → Z']];

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Danh Mục Sách</span>
                    ${this.filters.keyword ? `<span>/</span> <span>Tìm kiếm: "${esc(this.filters.keyword)}"</span>` : ''}
                </div>

                <div class="catalog-layout">
                    <!-- Sidebar Filters -->
                    <aside class="catalog-sidebar">
                        <div class="d-flex items-center justify-between pb-3 mb-3" style="border-bottom: 1px solid var(--border-color);">
                            <h3 class="font-bold text-base d-flex items-center gap-2">
                                <i class="fa-solid fa-filter text-primary"></i> Bộ Lọc Tìm Kiếm
                            </h3>
                            <button class="btn btn-xs btn-ghost text-primary" onclick="catalogPage.resetFilters()">Xoá tất cả</button>
                        </div>

                        <div class="filter-group">
                            <div class="filter-header"><span>Thể Loại Sách</span></div>
                            <div class="filter-options-list">
                                ${radio('cat-filter', '', 'Tất cả thể loại', !this.filters.category, "catalogPage.setFilter('category', '')")}
                                ${categories.map(c => radio('cat-filter', c.id, esc(c.name), this.filters.category === c.id, `catalogPage.setFilter('category', '${c.id}')`)).join('')}
                            </div>
                        </div>

                        <div class="filter-group">
                            <div class="filter-header"><span>Tác Giả</span></div>
                            <select class="form-select form-select-sm" id="author-filter" onchange="catalogPage.setFilter('authorId', this.value)">
                                <option value="">Tất cả tác giả</option>
                                ${authors.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}
                            </select>
                        </div>

                        <div class="filter-group">
                            <div class="filter-header"><span>Nhà Xuất Bản</span></div>
                            <div class="filter-options-list">
                                ${radio('pub-filter', '', 'Tất cả NXB', true, "catalogPage.setFilter('publisherId', '')")}
                                ${publishers.map(p => radio('pub-filter', p.id, esc(p.name), false, `catalogPage.setFilter('publisherId', '${p.id}')`)).join('')}
                            </div>
                        </div>

                        <div class="filter-group">
                            <div class="filter-header"><span>Khoảng Giá</span></div>
                            <div class="filter-options-list">
                                ${radio('price-filter', 'all', 'Tất cả mức giá', true, 'catalogPage.setPriceRange(null, null)')}
                                ${radio('price-filter', '0-100', 'Dưới 100.000 ₫', false, 'catalogPage.setPriceRange(0, 100000)')}
                                ${radio('price-filter', '100-200', '100.000 ₫ - 200.000 ₫', false, 'catalogPage.setPriceRange(100000, 200000)')}
                                ${radio('price-filter', '200-400', '200.000 ₫ - 400.000 ₫', false, 'catalogPage.setPriceRange(200000, 400000)')}
                                ${radio('price-filter', '400+', 'Trên 400.000 ₫', false, 'catalogPage.setPriceRange(400000, null)')}
                            </div>
                        </div>

                        <div class="filter-group">
                            <div class="filter-header"><span>Đánh Giá Sao</span></div>
                            <div class="filter-options-list">
                                ${radio('rating-filter', '', 'Tất cả', true, "catalogPage.setFilter('rating', null)")}
                                ${[4, 3].map(r => `
                                    <label class="filter-checkbox-item">
                                        <div class="d-flex items-center">
                                            <input type="radio" name="rating-filter" value="${r}" onchange="catalogPage.setFilter('rating', ${r})">
                                            <div class="star-rating ml-1"><i class="fa-solid fa-star"></i><span class="text-xs text-muted ml-1">Từ ${r} sao trở lên</span></div>
                                        </div>
                                    </label>`).join('')}
                            </div>
                        </div>
                    </aside>

                    <main class="catalog-main">
                        <div class="catalog-toolbar">
                            <div class="d-flex items-center gap-2">
                                <span class="font-bold text-sm" id="catalog-count-text">Đang tải danh sách...</span>
                            </div>
                            <div class="d-flex items-center gap-2">
                                <span class="text-xs text-muted font-semibold">Sắp xếp:</span>
                                <select class="form-select form-select-sm" id="catalog-sort" style="width: auto; padding: 0.35rem 0.75rem;"
                                        onchange="catalogPage.setFilter('sort', this.value)">
                                    ${sorts.map(([v, l]) => `<option value="${v}" ${this.filters.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="active-filters-chips" id="active-filter-chips"></div>
                        <div class="book-grid" id="catalog-books-grid"></div>
                        <div class="d-flex items-center justify-center gap-2 mt-4" id="catalog-pagination"></div>
                    </main>
                </div>
            </div>
        `;

        await this.fetchAndRenderBooks();
    },

    async fetchAndRenderBooks() {
        const grid = document.getElementById('catalog-books-grid');
        const countText = document.getElementById('catalog-count-text');
        if (!grid) return;
        const seq = ++this.requestSeq;

        grid.innerHTML = `
            <div class="col-span-full py-12 text-center" style="grid-column: 1 / -1;">
                <div class="spinner-ring"></div>
                <p class="mt-2 text-muted text-sm">Đang tải danh sách sách...</p>
            </div>
        `;

        const f = this.filters;
        try {
            const { items: books, pagination } = await ApiService.books.list({
                keyword: f.keyword, categoryId: f.category, authorId: f.authorId, publisherId: f.publisherId,
                minPrice: f.minPrice, maxPrice: f.maxPrice, minRating: f.rating, sortBy: f.sort,
                page: this.page, size: this.PAGE_SIZE
            });
            if (seq !== this.requestSeq || !document.getElementById('catalog-books-grid')) return;

            if (countText) countText.textContent = `Tìm thấy ${pagination.totalElements} tác phẩm`;
            this.renderChips(document.getElementById('active-filter-chips'));
            this.renderPagination(pagination);

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
            if (seq === this.requestSeq) grid.innerHTML = `<div class="p-4 text-danger text-center" style="grid-column: 1 / -1;">Lỗi tải dữ liệu: ${esc(err.message)}</div>`;
        }
    },

    renderPagination(p) {
        const box = document.getElementById('catalog-pagination');
        if (!box) return;
        if (p.totalPages <= 1) { box.innerHTML = ''; return; }

        const pages = [];
        for (let i = 0; i < p.totalPages; i++) {
            if (i === 0 || i === p.totalPages - 1 || Math.abs(i - this.page) <= 1) pages.push(i);
            else if (pages[pages.length - 1] !== '…') pages.push('…');
        }
        box.innerHTML = `
            <button class="btn btn-ghost btn-sm" ${this.page === 0 ? 'disabled' : ''} onclick="catalogPage.goToPage(${this.page - 1})"><i class="fa-solid fa-chevron-left"></i></button>
            ${pages.map(i => i === '…' ? '<span class="text-muted">…</span>'
                : `<button class="btn ${i === this.page ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="catalogPage.goToPage(${i})">${i + 1}</button>`).join('')}
            <button class="btn btn-ghost btn-sm" ${this.page >= p.totalPages - 1 ? 'disabled' : ''} onclick="catalogPage.goToPage(${this.page + 1})"><i class="fa-solid fa-chevron-right"></i></button>
        `;
    },

    goToPage(n) {
        this.page = n;
        this.fetchAndRenderBooks();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderChips(container) {
        if (!container) return;
        const f = this.filters;
        const chip = (text, clear) => `<span class="filter-chip">${text} <i class="fa-solid fa-xmark filter-chip-remove" onclick="${clear}"></i></span>`;
        const chips = [];

        if (f.keyword) chips.push(chip(`Từ khoá: "${esc(f.keyword)}"`, "catalogPage.setFilter('keyword', '')"));
        if (f.category) {
            const cat = store.getCategories().find(c => c.id === f.category);
            chips.push(chip(`Thể loại: ${esc(cat ? cat.name : f.category)}`, "catalogPage.setFilter('category', '')"));
        }
        if (f.authorId) {
            const a = store.getAuthors().find(x => x.id === f.authorId);
            chips.push(chip(`Tác giả: ${esc(a ? a.name : '')}`, "catalogPage.setFilter('authorId', '')"));
        }
        if (f.publisherId) {
            const p = store.getPublishers().find(x => x.id === f.publisherId);
            chips.push(chip(`NXB: ${esc(p ? p.name : '')}`, "catalogPage.setFilter('publisherId', '')"));
        }
        if (f.minPrice !== null || f.maxPrice !== null) chips.push(chip('Giá lọc', 'catalogPage.setPriceRange(null, null)'));
        if (f.rating) chips.push(chip(`Từ ${f.rating} sao`, "catalogPage.setFilter('rating', null)"));

        container.innerHTML = chips.join('');
    },

    setFilter(key, value) {
        this.filters[key] = value;
        this.page = 0;
        this.syncControls();
        this.fetchAndRenderBooks();
    },

    setPriceRange(min, max) {
        this.filters.minPrice = min;
        this.filters.maxPrice = max;
        this.page = 0;
        this.syncControls();
        this.fetchAndRenderBooks();
    },

    // Đồng bộ ô chọn trong sidebar khi bộ lọc đổi bằng nút xoá chip
    syncControls() {
        const f = this.filters;
        const checkRadio = (name, value) => {
            const el = document.querySelector(`.catalog-sidebar input[name="${name}"][value="${value}"]`);
            if (el) el.checked = true;
        };
        checkRadio('cat-filter', f.category);
        checkRadio('pub-filter', f.publisherId);
        checkRadio('rating-filter', f.rating || '');
        if (f.minPrice === null && f.maxPrice === null) checkRadio('price-filter', 'all');
        const author = document.getElementById('author-filter');
        if (author) author.value = f.authorId;
        const sort = document.getElementById('catalog-sort');
        if (sort) sort.value = f.sort;
    },

    resetFilters() {
        this.filters = this.defaultFilters();
        this.page = 0;
        this.syncControls();
        this.fetchAndRenderBooks();
    }
};
