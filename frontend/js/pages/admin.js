/**
 * ADMIN PORTAL CONTROLLER (Giao diện Quản trị)
 * Dashboard, sách (upload ảnh thật), thể loại, tác giả/NXB, đơn hàng, người dùng,
 * mã giảm giá, phiên thanh toán QR & giao dịch ngân hàng. Dữ liệu lấy từ API thật.
 */

const adminPage = {
    activeTab: 'dashboard',
    editingBookId: null,
    editingEntity: null, // { kind, id }
    booksState: { page: 0, keyword: '' },
    ordersState: { page: 0, status: '' },
    searchTimer: null,
    data: { authors: [], publishers: [], categories: [], coupons: [] },

    ORDER_STATUS: {
        PENDING: ['Chờ Xử Lý', 'badge-warning'],
        CONFIRMED: ['Đã Xác Nhận', 'badge-info'],
        PROCESSING: ['Đang Chuẩn Bị', 'badge-info'],
        SHIPPING: ['Đang Giao', 'badge-info'],
        DELIVERED: ['Đã Giao', 'badge-success'],
        CANCELLED: ['Đã Huỷ', 'badge-danger'],
        RETURNED: ['Trả Hàng', 'badge-subtle']
    },
    PAYMENT_LABEL: { COD: 'COD', QR_CODE: 'VietQR', BANKING: 'Chuyển khoản', MOMO: 'MoMo', VNPAY: 'VNPay', STRIPE: 'Thẻ' },
    SESSION_STATUS: {
        PENDING: ['Chờ Thanh Toán', 'badge-warning'], PAID: ['Đã Thanh Toán', 'badge-success'],
        EXPIRED: ['Hết Hạn', 'badge-subtle'], CANCELLED: ['Đã Huỷ', 'badge-danger']
    },
    TX_RESULT: { PAID: 'badge-success', PARTIAL: 'badge-warning', LATE: 'badge-danger', DUPLICATE: 'badge-danger' },

    TABS: [
        ['dashboard', 'fa-chart-pie', 'Dashboard Thống Kê'],
        ['books', 'fa-book-open', 'Quản Lý Sách'],
        ['categories', 'fa-folder-tree', 'Quản Lý Thể Loại'],
        ['authors_pubs', 'fa-users-gear', 'Tác Giả & Nhà Xuất Bản'],
        ['orders', 'fa-receipt', 'Quản Lý Đơn Hàng'],
        ['payments', 'fa-qrcode', 'Thanh Toán QR'],
        ['coupons', 'fa-ticket', 'Mã Giảm Giá'],
        ['users', 'fa-users', 'Người Dùng']
    ],

    // Định nghĩa form chung cho thể loại / tác giả / NXB / mã giảm giá
    ENTITY: {
        category: {
            label: 'Thể Loại', api: () => ApiService.categories, list: () => store.getCategories(),
            fields: [
                { key: 'name', label: 'Tên thể loại', required: true },
                { key: 'icon', label: 'Biểu tượng FontAwesome', placeholder: 'fa-solid fa-book', def: 'fa-solid fa-book' },
                { key: 'description', label: 'Mô tả', type: 'textarea' },
                { key: 'displayOrder', label: 'Thứ tự hiển thị', type: 'number', def: 0 }
            ]
        },
        author: {
            label: 'Tác Giả', api: () => ApiService.authors, list: () => store.getAuthors(),
            fields: [
                { key: 'name', label: 'Họ tên tác giả', required: true },
                { key: 'nationality', label: 'Quốc tịch', def: 'Việt Nam' },
                { key: 'birthYear', label: 'Năm sinh', type: 'number' },
                { key: 'avatar', label: 'Link ảnh đại diện' },
                { key: 'bio', label: 'Tiểu sử', type: 'textarea' }
            ]
        },
        publisher: {
            label: 'Nhà Xuất Bản', api: () => ApiService.publishers, list: () => store.getPublishers(),
            fields: [
                { key: 'name', label: 'Tên nhà xuất bản', required: true },
                { key: 'address', label: 'Địa chỉ' },
                { key: 'phone', label: 'Số điện thoại' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'website', label: 'Website' }
            ]
        },
        coupon: {
            label: 'Mã Giảm Giá', api: () => ({
                create: (b) => ApiService.admin.createCoupon(b), update: (id, b) => ApiService.admin.updateCoupon(id, b)
            }), list: () => adminPage.data.coupons,
            fields: [
                { key: 'code', label: 'Mã giảm giá', required: true, placeholder: 'VD: SALE20' },
                { key: 'description', label: 'Mô tả' },
                { key: 'discountType', label: 'Loại giảm', type: 'select', options: [['PERCENTAGE', 'Theo phần trăm (%)'], ['FIXED_AMOUNT', 'Số tiền cố định (₫)']], def: 'PERCENTAGE' },
                { key: 'discountValue', label: 'Giá trị giảm', type: 'number', required: true },
                { key: 'minOrderAmount', label: 'Đơn tối thiểu (₫)', type: 'number', def: 0 },
                { key: 'maxDiscountAmount', label: 'Giảm tối đa (₫)', type: 'number' },
                { key: 'endDate', label: 'Hết hạn', type: 'datetime-local' },
                { key: 'usageLimit', label: 'Số lượt dùng tối đa', type: 'number' },
                { key: 'active', label: 'Đang hoạt động', type: 'checkbox', def: true }
            ]
        }
    },

    async render(container, queryParams = {}) {
        this.activeTab = queryParams.tab || this.activeTab || 'dashboard';
        const user = store.currentUser;

        container.innerHTML = `
            <div class="admin-layout-wrapper">
                <aside class="admin-sidebar">
                    <div class="admin-sidebar-header">
                        <div class="d-flex items-center gap-2">
                            <div class="user-avatar-sm" style="background: var(--accent); color: #ffffff;"><i class="fa-solid fa-shield-halved"></i></div>
                            <div>
                                <div class="font-bold text-sm">${esc(user.name)}</div>
                                <div class="text-xs text-muted">${user.role === 'ADMIN' ? 'Quản Trị Viên' : 'Nhân Viên'}</div>
                            </div>
                        </div>
                    </div>

                    ${this.TABS.map(([key, icon, label]) => `
                        <div class="admin-sidebar-item ${this.activeTab === key ? 'active' : ''}" data-tab="${key}" onclick="adminPage.switchTab('${key}')">
                            <i class="fa-solid ${icon}"></i>
                            <span>${label}</span>
                        </div>
                    `).join('')}

                    <div class="mt-auto pt-4" style="border-top: 1px solid var(--border-subtle);">
                        <div class="admin-sidebar-item" onclick="app.navigate('#/')">
                            <i class="fa-solid fa-store"></i>
                            <span>Về Giao Diện Khách</span>
                        </div>
                    </div>
                </aside>

                <main class="admin-main-viewport" id="admin-viewport"></main>
            </div>

            ${this.bookModalHtml()}

            <!-- Modal: Thể loại / Tác giả / NXB / Mã giảm giá -->
            <div id="entity-modal" class="modal-overlay hidden">
                <div class="modal-dialog modal-sm">
                    <div class="modal-header">
                        <h3 class="modal-title" id="entity-modal-title"></h3>
                        <button class="modal-close-btn" onclick="modalManager.close('entity-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="entity-form" onsubmit="adminPage.handleSaveEntity(event)"></form>
                    </div>
                </div>
            </div>
        `;

        await this.renderActiveTab();
    },

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.admin-sidebar-item[data-tab]').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
        return this.renderActiveTab();
    },

    async renderActiveTab() {
        const viewport = document.getElementById('admin-viewport');
        if (!viewport) return;

        const tab = this.activeTab;
        const stillHere = () => this.activeTab === tab && document.getElementById('admin-viewport') === viewport;
        viewport.innerHTML = '<div class="text-center py-8 text-muted"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tải dữ liệu...</div>';

        const renderers = {
            dashboard: () => this.renderDashboard(viewport, stillHere),
            books: () => this.renderBooks(viewport, stillHere),
            categories: () => this.renderCategories(viewport, stillHere),
            authors_pubs: () => this.renderAuthorsPublishers(viewport, stillHere),
            orders: () => this.renderOrders(viewport, stillHere),
            payments: () => this.renderPayments(viewport, stillHere),
            coupons: () => this.renderCoupons(viewport, stillHere),
            users: () => this.renderUsers(viewport, stillHere)
        };

        try {
            await renderers[tab]();
        } catch (err) {
            if (stillHere()) {
                viewport.innerHTML = `<div class="text-center py-8 text-danger">${esc(err.message || 'Không tải được dữ liệu.')}</div>`;
            }
        }
    },

    pageHeader(title, subtitle, actionHtml = '') {
        return `
            <div class="d-flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">${title}</h1>
                    <p class="text-xs text-muted mt-1">${subtitle}</p>
                </div>
                <div class="d-flex gap-2">${actionHtml}</div>
            </div>`;
    },

    orderBadge(status) {
        const [label, cls] = this.ORDER_STATUS[status] || [status, 'badge-subtle'];
        return `<span class="badge ${cls}">${label}</span>`;
    },

    paginationHtml(p, fnName) {
        if (!p || p.totalPages <= 1) return '';
        const cur = p.page;
        const pages = [];
        for (let i = 0; i < p.totalPages; i++) {
            if (i === 0 || i === p.totalPages - 1 || Math.abs(i - cur) <= 1) pages.push(i);
            else if (pages[pages.length - 1] !== '…') pages.push('…');
        }
        return `
            <div class="d-flex items-center justify-center gap-2 mt-4">
                <button class="btn btn-ghost btn-sm" ${cur === 0 ? 'disabled' : ''} onclick="adminPage.${fnName}(${cur - 1})"><i class="fa-solid fa-chevron-left"></i></button>
                ${pages.map(i => i === '…' ? '<span class="text-muted">…</span>'
                    : `<button class="btn ${i === cur ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="adminPage.${fnName}(${i})">${i + 1}</button>`).join('')}
                <button class="btn btn-ghost btn-sm" ${cur >= p.totalPages - 1 ? 'disabled' : ''} onclick="adminPage.${fnName}(${cur + 1})"><i class="fa-solid fa-chevron-right"></i></button>
            </div>`;
    },

    /* ============================ 1. DASHBOARD ============================ */

    async renderDashboard(container, stillHere) {
        const s = await ApiService.admin.dashboard();
        if (!stillHere()) return;

        const monthly = s.monthlyRevenue || [];
        const revenueMillions = monthly.map(v => Math.round((Number(v) / 1e6) * 10) / 10);
        const colors = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#64748b'];
        const catEntries = Object.entries(s.categoryRevenue || {}).filter(([, v]) => Number(v) > 0).slice(0, 6);
        const catTotal = catEntries.reduce((sum, [, v]) => sum + Number(v), 0);
        const segments = catEntries.map(([label, v], i) => ({
            label, percent: Math.round((Number(v) / catTotal) * 100), color: colors[i % colors.length]
        }));
        const year = new Date().getFullYear();

        container.innerHTML = `
            ${this.pageHeader('Tổng Quan Doanh Thu & Đơn Hàng', 'Số liệu thực tế lấy trực tiếp từ cơ sở dữ liệu BookNest.',
                `<button class="btn btn-primary btn-sm" onclick="adminPage.openBookModal()"><i class="fa-solid fa-plus mr-1"></i> Thêm Sách Mới</button>`)}

            <div class="admin-stats-grid">
                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Doanh Thu (đơn đã thu tiền)</div>
                        <div class="stat-value">${store.formatCurrency(Number(s.totalRevenue))}</div>
                        <div class="stat-trend text-muted"><i class="fa-solid fa-calendar-day"></i> ${s.todayOrders} đơn hôm nay</div>
                    </div>
                    <div class="stat-icon-box stat-icon-blue"><i class="fa-solid fa-sack-dollar"></i></div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Tổng Đơn Hàng</div>
                        <div class="stat-value">${s.totalOrders}</div>
                        <div class="stat-trend ${s.pendingOrders ? 'text-warning' : 'text-muted'}"><i class="fa-solid fa-clock"></i> ${s.pendingOrders} đơn chờ xử lý</div>
                    </div>
                    <div class="stat-icon-box stat-icon-green"><i class="fa-solid fa-truck-ramp-box"></i></div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Đầu Sách</div>
                        <div class="stat-value">${s.totalBooks}</div>
                        <div class="stat-trend ${s.lowStockBooks ? 'text-danger' : 'text-muted'}"><i class="fa-solid fa-boxes-stacked"></i> ${s.lowStockBooks} sách sắp hết hàng</div>
                    </div>
                    <div class="stat-icon-box stat-icon-amber"><i class="fa-solid fa-book-bookmark"></i></div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Khách Hàng</div>
                        <div class="stat-value">${s.totalCustomers}</div>
                        <div class="stat-trend text-muted"><i class="fa-solid fa-users"></i> ${s.totalUsers} tài khoản</div>
                    </div>
                    <div class="stat-icon-box stat-icon-purple"><i class="fa-solid fa-users"></i></div>
                </div>
            </div>

            <div class="dashboard-charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <div>
                            <h3 class="font-bold text-base">Doanh Thu 12 Tháng (Triệu VNĐ)</h3>
                            <p class="text-xs text-muted">Chỉ tính các đơn đã thanh toán / đã giao</p>
                        </div>
                        <span class="badge badge-primary">Năm ${year}</span>
                    </div>
                    <div class="chart-canvas-wrapper"><canvas id="revenue-line-chart"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="chart-header">
                        <div>
                            <h3 class="font-bold text-base">Cơ Cấu Thể Loại Sách</h3>
                            <p class="text-xs text-muted">Tỷ trọng doanh thu theo thể loại chính</p>
                        </div>
                    </div>
                    ${segments.length
                        ? '<div class="chart-canvas-wrapper"><canvas id="category-donut-chart"></canvas></div>'
                        : '<div class="text-center text-muted text-sm py-8">Chưa có doanh thu để thống kê.</div>'}
                </div>
            </div>

            <div class="admin-card-container">
                <div class="d-flex items-center justify-between mb-4">
                    <h3 class="font-bold text-base">Đơn Hàng Mới Nhất</h3>
                    <button class="btn btn-ghost btn-sm text-primary" onclick="adminPage.switchTab('orders')">Xem tất cả đơn →</button>
                </div>
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Mã Đơn</th><th>Khách Hàng</th><th>Ngày Đặt</th><th>Tổng Tiền</th><th>Thanh Toán</th><th>Trạng Thái</th></tr></thead>
                        <tbody>
                            ${(s.recentOrders || []).map(o => `
                                <tr>
                                    <td><strong class="text-primary">#${esc(o.orderCode)}</strong></td>
                                    <td>${esc(o.customerName)}</td>
                                    <td>${store.formatDate(o.createdAt)}</td>
                                    <td><strong>${store.formatCurrency(Number(o.totalAmount))}</strong></td>
                                    <td><span class="badge ${o.paymentMethod === 'QR_CODE' ? 'badge-primary' : 'badge-subtle'}">${esc(this.PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod)}</span></td>
                                    <td>${this.orderBadge(o.status)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có đơn hàng nào.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        setTimeout(() => {
            chartRenderer.renderRevenueLineChart('revenue-line-chart', revenueMillions);
            if (segments.length) chartRenderer.renderCategoryDonutChart('category-donut-chart', segments);
        }, 50);
    },

    /* ============================== 2. SÁCH ============================== */

    async renderBooks(container, stillHere) {
        const { page, keyword } = this.booksState;
        const [{ items: books, pagination }] = await Promise.all([
            ApiService.books.list({ page, size: 10, keyword, sortBy: 'newest' }),
            this.ensureCatalog()
        ]);
        if (!stillHere()) return;

        container.innerHTML = `
            ${this.pageHeader('Quản Lý Danh Mục Sách', `Có ${pagination.totalElements} đầu sách${keyword ? ` khớp "${esc(keyword)}"` : ' trong hệ thống'}.`,
                `<button class="btn btn-primary" onclick="adminPage.openBookModal()"><i class="fa-solid fa-plus mr-1"></i> Thêm Sách Mới</button>`)}

            <div class="admin-card-container">
                <div class="data-table-toolbar">
                    <div class="input-with-icon" style="max-width: 320px;">
                        <i class="fa-solid fa-magnifying-glass input-icon"></i>
                        <input type="text" id="admin-book-search" class="form-input" placeholder="Tìm tên sách, tác giả..." value="${esc(keyword)}" oninput="adminPage.searchBooks(this.value)">
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Ảnh</th><th>Tựa Đề Sách</th><th>Tác Giả</th><th>Thể Loại</th><th>Giá Bán</th><th>Kho</th><th>Đã Bán</th><th>Hành Động</th></tr></thead>
                        <tbody>
                            ${books.map(b => `
                                <tr>
                                    <td><img src="${esc(b.coverImage)}" alt="${esc(b.title)}" class="table-img-thumb" onerror="this.onerror=null; this.src=app.getBookPlaceholder(this.alt, '');"></td>
                                    <td>
                                        <div class="font-bold text-truncate" style="max-width: 240px;" title="${esc(b.title)}">${esc(b.title)}</div>
                                        <span class="text-xs text-muted">NXB: ${esc(b.publisherName || '—')}</span>
                                    </td>
                                    <td>${esc(b.authorName)}</td>
                                    <td><span class="badge badge-primary">${esc(b.categoryName)}</span></td>
                                    <td>
                                        <strong class="text-primary">${store.formatCurrency(b.price)}</strong>
                                        ${b.originalPrice ? `<div class="text-xs text-muted" style="text-decoration: line-through;">${store.formatCurrency(b.originalPrice)}</div>` : ''}
                                    </td>
                                    <td><span class="${b.stock <= 5 ? 'text-danger font-bold' : ''}">${b.stock} cuốn</span></td>
                                    <td>${b.soldCount || 0}</td>
                                    <td>
                                        <div class="table-actions-cell">
                                            <button class="btn btn-xs btn-ghost text-primary" title="Sửa" onclick="adminPage.openBookModal('${b.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                                            <button class="btn btn-xs btn-ghost text-danger" title="Xoá" onclick="adminPage.deleteBook('${b.id}')"><i class="fa-solid fa-trash-can"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="8" class="text-center text-muted py-4">Không có sách nào.</td></tr>'}
                        </tbody>
                    </table>
                </div>
                ${this.paginationHtml(pagination, 'goBooksPage')}
            </div>
        `;
    },

    searchBooks(value) {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(async () => {
            this.booksState = { page: 0, keyword: value.trim() };
            await this.renderActiveTab();
            const input = document.getElementById('admin-book-search');
            if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
        }, 350);
    },

    goBooksPage(n) {
        this.booksState.page = n;
        return this.renderActiveTab();
    },

    // Danh mục thể loại / tác giả / NXB mới nhất cho các form
    async ensureCatalog() {
        await Promise.all([store.reloadCategories(), store.reloadAuthors(), store.reloadPublishers()]);
    },

    bookModalHtml() {
        return `
            <div id="book-form-modal" class="modal-overlay hidden">
                <div class="modal-dialog modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title" id="book-modal-title">Thêm Sách Mới Vào Kho</h3>
                        <button class="modal-close-btn" onclick="modalManager.close('book-form-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="admin-book-form" onsubmit="adminPage.handleSaveBook(event)">
                            <div class="form-group">
                                <label class="form-label">Tên Sách / Tựa Đề <span class="required-mark">*</span></label>
                                <input type="text" id="bm-title" class="form-input" required placeholder="Nhập tên sách...">
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Thể Loại Chính <span class="required-mark">*</span></label>
                                    <select id="bm-category" class="form-select" required></select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Nhà Xuất Bản <span class="required-mark">*</span></label>
                                    <select id="bm-publisher" class="form-select" required></select>
                                </div>
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Tác Giả <span class="required-mark">*</span> <span class="text-xs text-muted">(giữ Ctrl để chọn nhiều)</span></label>
                                    <select id="bm-author" class="form-select" multiple size="4" required></select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Thể Loại Phụ <span class="text-xs text-muted">(giữ Ctrl để chọn nhiều)</span></label>
                                    <select id="bm-subcategories" class="form-select" multiple size="4"></select>
                                </div>
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Giá Niêm Yết (₫) <span class="required-mark">*</span></label>
                                    <input type="number" id="bm-price" class="form-input" required min="1000" step="1000" placeholder="300000">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Giá Khuyến Mãi (₫)</label>
                                    <input type="number" id="bm-sale-price" class="form-input" min="0" step="1000" placeholder="Bỏ trống nếu không giảm">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Số Lượng Trong Kho <span class="required-mark">*</span></label>
                                    <input type="number" id="bm-stock" class="form-input" required min="0" value="50">
                                </div>
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Số Trang</label>
                                    <input type="number" id="bm-pages" class="form-input" min="1" placeholder="380">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Năm Xuất Bản</label>
                                    <input type="number" id="bm-year" class="form-input" value="2025">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Mã ISBN</label>
                                    <input type="text" id="bm-isbn" class="form-input" placeholder="978...">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Trạng Thái</label>
                                    <select id="bm-status" class="form-select">
                                        <option value="AVAILABLE">Đang bán</option>
                                        <option value="OUT_OF_STOCK">Hết hàng</option>
                                        <option value="DISCONTINUED">Ngừng bán</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Hình Ảnh Bìa Sách</label>
                                <div class="image-upload-dropzone" id="book-image-dropzone" onclick="document.getElementById('bm-file-input').click()">
                                    <input type="file" id="bm-file-input" accept="image/*" class="d-none" onchange="adminPage.handleImageUpload(event)">
                                    <div class="dropzone-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                                    <div class="font-bold text-sm" id="bm-upload-text">Bấm để tải ảnh lên từ máy tính</div>
                                    <div class="text-xs text-muted mt-1">JPG, PNG, WebP, GIF — ảnh được lưu trên máy chủ</div>
                                </div>
                                <div class="image-preview-box d-none" id="bm-image-preview-container">
                                    <img id="bm-image-preview" src="" alt="Preview" class="image-preview-thumb">
                                    <div class="flex-1">
                                        <input type="text" id="bm-image-url" class="form-input text-xs" placeholder="Hoặc dán URL ảnh trực tiếp tại đây" oninput="adminPage.previewUrl(this.value)">
                                    </div>
                                    <button type="button" class="btn btn-xs btn-outline-danger" onclick="adminPage.clearUploadedImage()">Xoá</button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Mô Tả Tóm Tắt Cuốn Sách</label>
                                <textarea id="bm-description" class="form-textarea" rows="3" placeholder="Nhập nội dung giới thiệu sách..."></textarea>
                            </div>

                            <div class="modal-footer px-0 pb-0">
                                <button type="button" class="btn btn-ghost" onclick="modalManager.close('book-form-modal')">Huỷ Bỏ</button>
                                <button type="submit" class="btn btn-primary" id="btn-save-book"><i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Thông Tin Sách</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;
    },

    async openBookModal(bookId = null) {
        this.editingBookId = bookId;
        try {
            await this.ensureCatalog();
            const book = bookId ? await ApiService.books.get(bookId) : null;
            const options = (list, selected = []) => list.map(i => `<option value="${i.id}" ${selected.includes(i.id) ? 'selected' : ''}>${esc(i.name)}</option>`).join('');
            const mainCat = book ? book.categories.slice(0, 1).map(c => c.id) : [];

            document.getElementById('bm-category').innerHTML = options(store.getCategories(), mainCat);
            document.getElementById('bm-subcategories').innerHTML = options(store.getCategories(), book ? book.categories.slice(1).map(c => c.id) : []);
            document.getElementById('bm-author').innerHTML = options(store.getAuthors(), book ? book.authors.map(a => a.id) : []);
            document.getElementById('bm-publisher').innerHTML = options(store.getPublishers(), book && book.publisherId ? [book.publisherId] : []);

            const set = (id, v) => { document.getElementById(id).value = v === null || v === undefined ? '' : v; };
            document.getElementById('admin-book-form').reset();
            this.clearUploadedImage();
            document.getElementById('book-modal-title').textContent = book ? `Chỉnh Sửa Sách: ${book.title}` : 'Thêm Sách Mới Vào Kho';
            if (book) {
                set('bm-title', book.title);
                set('bm-price', book.listPrice);
                set('bm-sale-price', book.salePriceRaw);
                set('bm-stock', book.stock);
                set('bm-pages', book.pages);
                set('bm-year', book.publishYear);
                set('bm-isbn', book.isbn);
                set('bm-status', book.status || 'AVAILABLE');
                set('bm-description', book.description);
                if (book.rawCoverImage) this.setImagePreview(book.rawCoverImage);
            }
            modalManager.open('book-form-modal');
        } catch (err) {
            app.showError(err);
        }
    },

    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const text = document.getElementById('bm-upload-text');
        text.textContent = 'Đang tải ảnh lên...';
        try {
            const { url } = await ApiService.uploadImage(file);
            this.setImagePreview(url);
            appToast.success('Đã tải ảnh bìa lên máy chủ.');
        } catch (err) {
            app.showError(err);
        } finally {
            text.textContent = 'Bấm để tải ảnh lên từ máy tính';
        }
    },

    setImagePreview(url) {
        document.getElementById('bm-image-preview').src = url;
        document.getElementById('bm-image-url').value = url;
        document.getElementById('bm-image-preview-container').classList.remove('d-none');
    },

    previewUrl(url) {
        document.getElementById('bm-image-preview').src = url.trim();
    },

    clearUploadedImage() {
        const byId = (id) => document.getElementById(id);
        byId('bm-image-preview').src = '';
        byId('bm-image-url').value = '';
        byId('bm-file-input').value = '';
        byId('bm-image-preview-container').classList.add('d-none');
    },

    async handleSaveBook(e) {
        e.preventDefault();
        const val = (id) => document.getElementById(id).value.trim();
        const int = (id) => { const v = val(id); return v === '' ? null : parseInt(v, 10); };
        const picked = (id) => [...document.getElementById(id).selectedOptions].map(o => Number(o.value));

        const authorIds = picked('bm-author');
        if (authorIds.length === 0) { appToast.warning('Vui lòng chọn ít nhất 1 tác giả.'); return; }
        const primary = Number(val('bm-category'));
        const salePrice = int('bm-sale-price');
        const price = int('bm-price');
        if (salePrice !== null && salePrice >= price) { appToast.warning('Giá khuyến mãi phải nhỏ hơn giá niêm yết.'); return; }

        const payload = {
            title: val('bm-title'),
            isbn: val('bm-isbn') || null,
            description: val('bm-description') || null,
            price,
            salePrice: salePrice || null,
            stockQuantity: int('bm-stock'),
            publishYear: int('bm-year'),
            pageCount: int('bm-pages'),
            coverImage: val('bm-image-url') || null,
            authorIds,
            publisherId: Number(val('bm-publisher')),
            primaryCategoryId: primary,
            subCategoryIds: picked('bm-subcategories').filter(id => id !== primary),
            status: val('bm-status')
        };

        const btn = document.getElementById('btn-save-book');
        btn.disabled = true;
        try {
            if (this.editingBookId) {
                await ApiService.admin.updateBook(this.editingBookId, payload);
                appToast.success('Cập nhật thông tin sách thành công!');
            } else {
                await ApiService.admin.createBook(payload);
                appToast.success('Đã thêm cuốn sách mới vào kho!');
            }
            modalManager.close('book-form-modal');
            await this.renderActiveTab();
        } catch (err) {
            app.showError(err);
        } finally {
            btn.disabled = false;
        }
    },

    deleteBook(bookId) {
        modalManager.confirm({
            title: 'Xoá Sách Khỏi Kho',
            message: 'Bạn có chắc chắn muốn xoá cuốn sách này không?',
            onConfirm: async () => {
                try {
                    await ApiService.admin.deleteBook(bookId);
                    appToast.info('Đã xoá sách khỏi danh mục.');
                    await this.renderActiveTab();
                } catch (err) {
                    app.showError(err);
                }
            }
        });
    },

    /* =========================== 3. THỂ LOẠI =========================== */

    async renderCategories(container, stillHere) {
        await store.reloadCategories();
        if (!stillHere()) return;
        const categories = store.getCategories();

        container.innerHTML = `
            ${this.pageHeader('Quản Lý Thể Loại', `${categories.length} thể loại sách trong hệ thống.`,
                `<button class="btn btn-primary" onclick="adminPage.openEntityModal('category')"><i class="fa-solid fa-folder-plus mr-1"></i> Thêm Thể Loại</button>`)}
            <div class="admin-card-container">
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Biểu Tượng</th><th>Tên Thể Loại</th><th>Slug</th><th>Thứ Tự</th><th>Hành Động</th></tr></thead>
                        <tbody>
                            ${categories.map(c => `
                                <tr>
                                    <td><i class="${esc(c.icon || 'fa-solid fa-folder')} text-primary"></i></td>
                                    <td><strong>${esc(c.name)}</strong></td>
                                    <td class="text-muted text-xs">${esc(c.slug)}</td>
                                    <td>${c.displayOrder}</td>
                                    <td>
                                        <div class="table-actions-cell">
                                            <button class="btn btn-xs btn-ghost text-primary" title="Sửa" onclick="adminPage.openEntityModal('category', '${c.id}')"><i class="fa-solid fa-pen"></i></button>
                                            <button class="btn btn-xs btn-ghost text-danger" title="Xoá" onclick="adminPage.deleteEntity('category', '${c.id}')"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /* ====================== 4. TÁC GIẢ & NHÀ XUẤT BẢN ====================== */

    async renderAuthorsPublishers(container, stillHere) {
        await Promise.all([store.reloadAuthors(), store.reloadPublishers()]);
        if (!stillHere()) return;
        const authors = store.getAuthors();
        const publishers = store.getPublishers();

        container.innerHTML = `
            ${this.pageHeader('Quản Lý Tác Giả & Nhà Xuất Bản', 'Danh sách đối tác xuất bản và các tác giả trong hệ thống.')}
            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
                <div class="admin-card-container">
                    <div class="d-flex items-center justify-between mb-4">
                        <h3 class="font-bold text-base"><i class="fa-solid fa-feather text-primary mr-1"></i> Tác Giả (${authors.length})</h3>
                        <button class="btn btn-xs btn-primary" onclick="adminPage.openEntityModal('author')">+ Thêm Tác Giả</button>
                    </div>
                    <div class="d-flex flex-column gap-3" style="max-height: 640px; overflow-y: auto;">
                        ${authors.map(a => `
                            <div class="d-flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                <div class="d-flex items-center gap-3">
                                    ${a.avatar ? `<img src="${esc(a.avatar)}" alt="" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'">`
                                        : `<div class="user-avatar-sm">${esc(a.name.charAt(0))}</div>`}
                                    <div>
                                        <div class="font-bold text-sm">${esc(a.name)}</div>
                                        <div class="text-xs text-muted">${esc(a.nationality || '')}</div>
                                    </div>
                                </div>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-xs btn-ghost text-primary" onclick="adminPage.openEntityModal('author', '${a.id}')"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-xs btn-ghost text-danger" onclick="adminPage.deleteEntity('author', '${a.id}')"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="admin-card-container">
                    <div class="d-flex items-center justify-between mb-4">
                        <h3 class="font-bold text-base"><i class="fa-solid fa-building text-primary mr-1"></i> Nhà Xuất Bản (${publishers.length})</h3>
                        <button class="btn btn-xs btn-primary" onclick="adminPage.openEntityModal('publisher')">+ Thêm NXB</button>
                    </div>
                    <div class="d-flex flex-column gap-3" style="max-height: 640px; overflow-y: auto;">
                        ${publishers.map(p => `
                            <div class="d-flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                <div>
                                    <div class="font-bold text-sm text-primary">${esc(p.name)}</div>
                                    <div class="text-xs text-muted">${esc([p.address, p.phone].filter(Boolean).join(' · '))}</div>
                                </div>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-xs btn-ghost text-primary" onclick="adminPage.openEntityModal('publisher', '${p.id}')"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-xs btn-ghost text-danger" onclick="adminPage.deleteEntity('publisher', '${p.id}')"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /* ============================ 5. ĐƠN HÀNG ============================ */

    async renderOrders(container, stillHere) {
        const { page, status } = this.ordersState;
        const { items: orders, pagination } = await ApiService.admin.orders({ page, status });
        if (!stillHere()) return;

        container.innerHTML = `
            ${this.pageHeader('Quản Lý Đơn Hàng', `${pagination.totalElements} đơn hàng${status ? ' ở trạng thái đã lọc' : ' từ khách'}.`)}
            <div class="admin-card-container">
                <div class="data-table-toolbar">
                    <select class="form-select" style="max-width: 220px;" onchange="adminPage.filterOrders(this.value)">
                        <option value="">Tất cả trạng thái</option>
                        ${Object.entries(this.ORDER_STATUS).map(([k, [label]]) => `<option value="${k}" ${status === k ? 'selected' : ''}>${label}</option>`).join('')}
                    </select>
                </div>
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Mã Đơn</th><th>Khách Hàng</th><th>Số ĐT</th><th>Ngày Đặt</th><th>Tổng Tiền</th><th>Thanh Toán</th><th>Trạng Thái</th><th>Cập Nhật</th></tr></thead>
                        <tbody>
                            ${orders.map(o => `
                                <tr>
                                    <td><strong class="text-primary">#${esc(o.orderCode)}</strong><div class="text-xs text-muted">${o.items.length} mặt hàng</div></td>
                                    <td>${esc(o.customerName)}</td>
                                    <td>${esc(o.customerPhone || 'N/A')}</td>
                                    <td>${store.formatDate(o.orderDate)}</td>
                                    <td><strong class="text-primary">${store.formatCurrency(o.totalAmount)}</strong></td>
                                    <td>
                                        <span class="badge badge-primary">${esc(this.PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod)}</span>
                                        <div class="text-xs ${o.paymentStatus === 'SUCCESS' ? 'text-success' : 'text-muted'}">${o.paymentStatus === 'SUCCESS' ? 'Đã thu tiền' : esc(o.paymentStatus)}</div>
                                    </td>
                                    <td>${this.orderBadge(o.orderStatus)}</td>
                                    <td>
                                        <select class="form-select form-select-sm" style="padding: 0.25rem 0.5rem; width: auto;" onchange="adminPage.updateOrderStatus('${o.id}', this.value)">
                                            ${Object.entries(this.ORDER_STATUS).map(([k, [label]]) => `<option value="${k}" ${o.orderStatus === k ? 'selected' : ''}>${label}</option>`).join('')}
                                        </select>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="8" class="text-center text-muted py-4">Không có đơn hàng nào.</td></tr>'}
                        </tbody>
                    </table>
                </div>
                ${this.paginationHtml(pagination, 'goOrdersPage')}
            </div>
        `;
    },

    filterOrders(status) {
        this.ordersState = { page: 0, status };
        return this.renderActiveTab();
    },

    goOrdersPage(n) {
        this.ordersState.page = n;
        return this.renderActiveTab();
    },

    async updateOrderStatus(id, status) {
        try {
            await ApiService.admin.updateOrderStatus(id, status);
            appToast.success('Cập nhật trạng thái đơn hàng thành công!');
        } catch (err) {
            app.showError(err);
        }
        await this.renderActiveTab();
    },

    /* ======================= 6. THANH TOÁN QR / NGÂN HÀNG ======================= */

    async renderPayments(container, stillHere) {
        const [sessions, transactions] = await Promise.all([ApiService.admin.qrSessions(), ApiService.admin.bankTransactions()]);
        if (!stillHere()) return;

        container.innerHTML = `
            ${this.pageHeader('Thanh Toán QR & Giao Dịch Ngân Hàng', 'Phiên thanh toán VietQR của khách và lịch sử giao dịch đối soát từ ngân hàng.',
                `<button class="btn btn-primary btn-sm" onclick="adminPage.syncBank()"><i class="fa-solid fa-rotate mr-1"></i> Đối Soát Ngay</button>`)}

            <div class="admin-card-container mb-6">
                <h3 class="font-bold text-base mb-4">Phiên Thanh Toán (${sessions.length})</h3>
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Mã Đơn</th><th>Nội Dung CK</th><th>Số Tiền</th><th>Đã Nhận</th><th>Tạo Lúc</th><th>Hết Hạn</th><th>Trạng Thái</th></tr></thead>
                        <tbody>
                            ${sessions.map(s => {
                                const [label, cls] = this.SESSION_STATUS[s.status] || [s.status, 'badge-subtle'];
                                return `
                                <tr>
                                    <td><strong class="text-primary">#${esc(s.orderCode)}</strong></td>
                                    <td><code>${esc(s.paymentCode)}</code></td>
                                    <td>${store.formatCurrency(s.amount)}</td>
                                    <td>${s.receivedAmount ? store.formatCurrency(s.receivedAmount) : '—'}</td>
                                    <td>${store.formatDateTime(s.createdAt)}</td>
                                    <td>${store.formatDateTime(s.expiresAt)}</td>
                                    <td><span class="badge ${cls}">${label}</span>${s.cancelReason ? `<div class="text-xs text-muted">${esc(s.cancelReason)}</div>` : ''}</td>
                                </tr>`;
                            }).join('') || '<tr><td colspan="7" class="text-center text-muted py-4">Chưa có phiên thanh toán nào.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="admin-card-container">
                <h3 class="font-bold text-base mb-4">Giao Dịch Ngân Hàng Đã Đối Soát (${transactions.length})</h3>
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Mã Tham Chiếu</th><th>Thời Gian</th><th>Số Tiền</th><th>Nội Dung</th><th>Đơn Hàng</th><th>Kết Quả</th></tr></thead>
                        <tbody>
                            ${transactions.map(t => `
                                <tr>
                                    <td><code>${esc(t.refNo)}</code></td>
                                    <td>${store.formatDateTime(t.transactionDate)}</td>
                                    <td><strong>${store.formatCurrency(Number(t.amount))}</strong></td>
                                    <td class="text-truncate" style="max-width: 260px;" title="${esc(t.description)}">${esc(t.description)}</td>
                                    <td><strong class="text-primary">#${esc(t.orderCode)}</strong></td>
                                    <td><span class="badge ${this.TX_RESULT[t.result] || 'badge-subtle'}">${esc(t.result)}</span>${t.note ? `<div class="text-xs text-muted">${esc(t.note)}</div>` : ''}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có giao dịch nào.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async syncBank() {
        try {
            const res = await ApiService.admin.syncBank();
            appToast.success(res.message || 'Đối soát xong.');
        } catch (err) {
            app.showError(err);
        }
        await this.renderActiveTab();
    },

    /* ============================ 7. MÃ GIẢM GIÁ ============================ */

    async renderCoupons(container, stillHere) {
        this.data.coupons = await ApiService.admin.coupons();
        if (!stillHere()) return;

        container.innerHTML = `
            ${this.pageHeader('Quản Lý Mã Giảm Giá', `${this.data.coupons.length} mã giảm giá trong hệ thống.`,
                `<button class="btn btn-primary" onclick="adminPage.openEntityModal('coupon')"><i class="fa-solid fa-plus mr-1"></i> Thêm Mã</button>`)}
            <div class="admin-card-container">
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Mã</th><th>Giảm</th><th>Đơn Tối Thiểu</th><th>Hết Hạn</th><th>Đã Dùng</th><th>Trạng Thái</th><th>Hành Động</th></tr></thead>
                        <tbody>
                            ${this.data.coupons.map(c => {
                                const expired = c.endDate && new Date(c.endDate) < new Date();
                                return `
                                <tr>
                                    <td><strong class="text-primary">${esc(c.code)}</strong><div class="text-xs text-muted">${esc(c.description || '')}</div></td>
                                    <td>${c.discountType === 'PERCENTAGE' ? `${c.discountValue}%${c.maxDiscountAmount ? ` (tối đa ${store.formatCurrency(c.maxDiscountAmount)})` : ''}` : store.formatCurrency(c.discountValue)}</td>
                                    <td>${c.minOrderAmount ? store.formatCurrency(c.minOrderAmount) : '—'}</td>
                                    <td>${c.endDate ? store.formatDate(c.endDate) : 'Không giới hạn'}</td>
                                    <td>${c.usedCount || 0}${c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                                    <td>${expired ? '<span class="badge badge-subtle">Hết hạn</span>' : c.active ? '<span class="badge badge-success">Hoạt động</span>' : '<span class="badge badge-danger">Đã tắt</span>'}</td>
                                    <td>
                                        <div class="table-actions-cell">
                                            <button class="btn btn-xs btn-ghost text-primary" title="Sửa" onclick="adminPage.openEntityModal('coupon', '${c.id}')"><i class="fa-solid fa-pen"></i></button>
                                            <button class="btn btn-xs btn-ghost ${c.active ? 'text-danger' : 'text-success'}" title="${c.active ? 'Tắt mã' : 'Bật mã'}" onclick="adminPage.toggleCoupon('${c.id}')"><i class="fa-solid ${c.active ? 'fa-ban' : 'fa-circle-check'}"></i></button>
                                        </div>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async toggleCoupon(id) {
        const c = this.data.coupons.find(x => x.id === id);
        try {
            await ApiService.admin.updateCoupon(id, this.couponBody(c, { active: !c.active }));
            await this.renderActiveTab();
        } catch (err) {
            app.showError(err);
        }
    },

    // Chuyển mã giảm giá đọc từ API về dạng body gửi lên
    couponBody(c, patch = {}) {
        const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit, active } = c;
        return { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit, active, ...patch };
    },

    /* ============================ 8. NGƯỜI DÙNG ============================ */

    async renderUsers(container, stillHere) {
        const users = await ApiService.admin.users();
        if (!stillHere()) return;
        const me = store.currentUser;
        const roles = [['CUSTOMER', 'Khách hàng'], ['STAFF', 'Nhân viên'], ['ADMIN', 'Quản trị viên']];
        const statuses = [['ACTIVE', 'Hoạt động'], ['INACTIVE', 'Tạm ngưng'], ['BANNED', 'Bị khoá']];

        container.innerHTML = `
            ${this.pageHeader('Quản Lý Người Dùng', `${users.length} tài khoản. Bạn không thể đổi quyền hay khoá chính mình.`)}
            <div class="admin-card-container">
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead><tr><th>Tài Khoản</th><th>Email</th><th>Số ĐT</th><th>Ngày Tạo</th><th>Quyền</th><th>Trạng Thái</th></tr></thead>
                        <tbody>
                            ${users.map(u => {
                                const self = u.id === me.id;
                                return `
                                <tr>
                                    <td><strong>${esc(u.name)}</strong><div class="text-xs text-muted">@${esc(u.username)}${self ? ' (bạn)' : ''}</div></td>
                                    <td>${esc(u.email)}</td>
                                    <td>${esc(u.phone || '—')}</td>
                                    <td>${store.formatDate(u.createdAt)}</td>
                                    <td>
                                        <select class="form-select form-select-sm" style="padding: 0.25rem 0.5rem; width: auto;" ${self ? 'disabled' : ''} onchange="adminPage.changeUser('${u.id}', 'role', this.value)">
                                            ${roles.map(([k, l]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${l}</option>`).join('')}
                                        </select>
                                    </td>
                                    <td>
                                        <select class="form-select form-select-sm" style="padding: 0.25rem 0.5rem; width: auto;" ${self ? 'disabled' : ''} onchange="adminPage.changeUser('${u.id}', 'status', this.value)">
                                            ${statuses.map(([k, l]) => `<option value="${k}" ${u.status === k ? 'selected' : ''}>${l}</option>`).join('')}
                                        </select>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async changeUser(id, field, value) {
        try {
            if (field === 'role') await ApiService.admin.updateUserRole(id, value);
            else await ApiService.admin.updateUserStatus(id, value);
            appToast.success('Đã cập nhật tài khoản.');
        } catch (err) {
            app.showError(err);
        }
        await this.renderActiveTab();
    },

    /* ================= Form chung: thể loại / tác giả / NXB / mã giảm giá ================= */

    openEntityModal(kind, id = null) {
        const cfg = this.ENTITY[kind];
        const item = id ? cfg.list().find(x => x.id === id) : null;
        this.editingEntity = { kind, id };

        document.getElementById('entity-modal-title').textContent = `${item ? 'Chỉnh Sửa' : 'Thêm'} ${cfg.label}`;
        document.getElementById('entity-form').innerHTML = cfg.fields.map(f => {
            let value = item ? item[f.key] : f.def;
            if (f.type === 'datetime-local' && value) value = String(value).slice(0, 16);
            value = value === null || value === undefined ? '' : value;
            const attrs = `id="ef-${f.key}" ${f.required ? 'required' : ''}`;
            let input;
            if (f.type === 'textarea') {
                input = `<textarea ${attrs} class="form-textarea" rows="3">${esc(value)}</textarea>`;
            } else if (f.type === 'select') {
                input = `<select ${attrs} class="form-select">${f.options.map(([k, l]) => `<option value="${k}" ${value === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
            } else if (f.type === 'checkbox') {
                return `<div class="form-group"><label class="form-checkbox-label text-sm font-semibold"><input type="checkbox" ${attrs} ${value ? 'checked' : ''}> ${f.label}</label></div>`;
            } else {
                input = `<input type="${f.type || 'text'}" ${attrs} class="form-input" value="${esc(value)}" placeholder="${esc(f.placeholder || '')}" ${f.type === 'number' ? 'step="any"' : ''}>`;
            }
            return `<div class="form-group"><label class="form-label">${f.label}${f.required ? ' <span class="required-mark">*</span>' : ''}</label>${input}</div>`;
        }).join('') + `
            <div class="modal-footer px-0 pb-0">
                <button type="button" class="btn btn-ghost" onclick="modalManager.close('entity-modal')">Huỷ</button>
                <button type="submit" class="btn btn-primary">Lưu</button>
            </div>`;
        modalManager.open('entity-modal');
    },

    async handleSaveEntity(e) {
        e.preventDefault();
        const { kind, id } = this.editingEntity;
        const cfg = this.ENTITY[kind];

        const body = {};
        for (const f of cfg.fields) {
            const el = document.getElementById(`ef-${f.key}`);
            if (f.type === 'checkbox') body[f.key] = el.checked;
            else if (el.value.trim() === '') continue;
            else if (f.type === 'number') body[f.key] = Number(el.value);
            else if (f.type === 'datetime-local') body[f.key] = `${el.value}:00`;
            else body[f.key] = el.value.trim();
        }
        if (kind === 'coupon') {
            if (body.code) body.code = body.code.toUpperCase();
            if (!id) body.startDate = new Date(Date.now() - 60000).toISOString().slice(0, 19);
            else {
                const old = cfg.list().find(x => x.id === id);
                if (old.startDate) body.startDate = old.startDate;
            }
        }

        try {
            if (id) await cfg.api().update(id, body);
            else await cfg.api().create(body);
            modalManager.close('entity-modal');
            appToast.success(`Đã lưu ${cfg.label.toLowerCase()}!`);
            await this.renderActiveTab();
        } catch (err) {
            app.showError(err);
        }
    },

    deleteEntity(kind, id) {
        const cfg = this.ENTITY[kind];
        modalManager.confirm({
            title: `Xoá ${cfg.label}`,
            message: `Bạn có chắc chắn muốn xoá ${cfg.label.toLowerCase()} này không?`,
            onConfirm: async () => {
                try {
                    await cfg.api().remove(id);
                    appToast.info(`Đã xoá ${cfg.label.toLowerCase()}.`);
                    await this.renderActiveTab();
                } catch (err) {
                    app.showError(err);
                }
            }
        });
    }
};
