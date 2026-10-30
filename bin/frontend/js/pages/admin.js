/**
 * ADMIN PORTAL CONTROLLER (Giao diện Quản trị - Minh Anh)
 * Dashboard with Revenue/Order Charts, Book Management with Upload preview,
 * Hierarchical Category Tree Manager, and Author/Publisher Management.
 */

const adminPage = {
    activeTab: 'dashboard', // 'dashboard' | 'books' | 'categories' | 'authors_pubs' | 'orders'
    editingBookId: null,

    render(container, queryParams = {}) {
        this.activeTab = queryParams.tab || this.activeTab || 'dashboard';

        container.innerHTML = `
            <div class="admin-layout-wrapper">
                <!-- Admin Sidebar -->
                <aside class="admin-sidebar">
                    <div class="admin-sidebar-header">
                        <div class="d-flex items-center gap-2">
                            <div class="user-avatar-sm" style="background: var(--accent); color: #ffffff;"><i class="fa-solid fa-shield-halved"></i></div>
                            <div>
                                <div class="font-bold text-sm">Minh Anh (Admin)</div>
                                <div class="text-xs text-muted">Hệ Thống Quản Trị</div>
                            </div>
                        </div>
                    </div>

                    <div class="admin-sidebar-item ${this.activeTab === 'dashboard' ? 'active' : ''}" onclick="adminPage.switchTab('dashboard')">
                        <i class="fa-solid fa-chart-pie"></i>
                        <span>Dashboard Thống Kê</span>
                    </div>

                    <div class="admin-sidebar-item ${this.activeTab === 'books' ? 'active' : ''}" onclick="adminPage.switchTab('books')">
                        <i class="fa-solid fa-book-open"></i>
                        <span>Quản Lý Sách</span>
                    </div>

                    <div class="admin-sidebar-item ${this.activeTab === 'categories' ? 'active' : ''}" onclick="adminPage.switchTab('categories')">
                        <i class="fa-solid fa-folder-tree"></i>
                        <span>Quản Lý Thể Loại (Cây)</span>
                    </div>

                    <div class="admin-sidebar-item ${this.activeTab === 'authors_pubs' ? 'active' : ''}" onclick="adminPage.switchTab('authors_pubs')">
                        <i class="fa-solid fa-users-gear"></i>
                        <span>Tác Giả & Nhà Xuất Bản</span>
                    </div>

                    <div class="admin-sidebar-item ${this.activeTab === 'orders' ? 'active' : ''}" onclick="adminPage.switchTab('orders')">
                        <i class="fa-solid fa-receipt"></i>
                        <span>Quản Lý Đơn Hàng</span>
                    </div>

                    <div class="mt-auto pt-4" style="border-top: 1px solid var(--border-subtle);">
                        <div class="admin-sidebar-item" onclick="app.toggleRole()">
                            <i class="fa-solid fa-store"></i>
                            <span>Về Giao Diện Khách</span>
                        </div>
                    </div>
                </aside>

                <!-- Admin Main Viewport -->
                <main class="admin-main-viewport" id="admin-viewport">
                    <!-- Tab content rendered dynamically -->
                </main>
            </div>

            <!-- Modal: Add / Edit Book -->
            <div id="book-form-modal" class="modal-overlay hidden">
                <div class="modal-dialog modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title" id="book-modal-title">Thêm Sách Mới Vào Kho</h3>
                        <button class="modal-close-btn" onclick="modalManager.close('book-form-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="admin-book-form" onsubmit="adminPage.handleSaveBook(event)">
                            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Tên Sách / Tựa Đề <span class="required-mark">*</span></label>
                                    <input type="text" id="bm-title" class="form-input" required placeholder="Nhập tên sách...">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Thể Loại <span class="required-mark">*</span></label>
                                    <select id="bm-category" class="form-select" required>
                                        <!-- Injected dynamically -->
                                    </select>
                                </div>
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Tác Giả <span class="required-mark">*</span></label>
                                    <select id="bm-author" class="form-select" required>
                                        <!-- Injected dynamically -->
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Nhà Xuất Bản <span class="required-mark">*</span></label>
                                    <select id="bm-publisher" class="form-select" required>
                                        <!-- Injected dynamically -->
                                    </select>
                                </div>
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Giá Bán (VNĐ) <span class="required-mark">*</span></label>
                                    <input type="number" id="bm-price" class="form-input" required min="1000" step="1000" placeholder="245000">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Giá Gốc Niêm Yết</label>
                                    <input type="number" id="bm-orig-price" class="form-input" min="1000" step="1000" placeholder="300000">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Số Lượng Trong Kho <span class="required-mark">*</span></label>
                                    <input type="number" id="bm-stock" class="form-input" required min="1" value="50">
                                </div>
                            </div>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Số Trang</label>
                                    <input type="number" id="bm-pages" class="form-input" placeholder="380">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Năm Xuất Bản</label>
                                    <input type="number" id="bm-year" class="form-input" value="2025">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Mã ISBN</label>
                                    <input type="text" id="bm-isbn" class="form-input" placeholder="978-0132350884">
                                </div>
                            </div>

                            <!-- Upload Image Dropzone with Preview -->
                            <div class="form-group">
                                <label class="form-label">Hình Ảnh Bìa Sách <span class="required-mark">*</span></label>
                                <div class="image-upload-dropzone" id="book-image-dropzone" onclick="document.getElementById('bm-file-input').click()">
                                    <input type="file" id="bm-file-input" accept="image/*" class="d-none" onchange="adminPage.handleImageUpload(event)">
                                    <div class="dropzone-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                                    <div class="font-bold text-sm">Bấm để tải ảnh lên hoặc Kéo thả ảnh bìa vào đây</div>
                                    <div class="text-xs text-muted mt-1">Hỗ trợ định dạng JPG, PNG, WebP</div>
                                </div>
                                
                                <div class="image-preview-box d-none" id="bm-image-preview-container">
                                    <img id="bm-image-preview" src="" alt="Preview" class="image-preview-thumb">
                                    <div class="flex-1">
                                        <input type="text" id="bm-image-url" class="form-input text-xs" placeholder="Hoặc dán URL ảnh trực tiếp tại đây">
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
                                <button type="submit" class="btn btn-primary" id="btn-save-book">
                                    <i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Thông Tin Sách
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal: Add / Edit Tree Category -->
            <div id="cat-form-modal" class="modal-overlay hidden">
                <div class="modal-dialog modal-sm">
                    <div class="modal-header">
                        <h3 class="modal-title" id="cat-modal-title">Thêm Thể Loại Mới</h3>
                        <button class="modal-close-btn" onclick="modalManager.close('cat-form-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="admin-cat-form" onsubmit="adminPage.handleSaveCategory(event)">
                            <input type="hidden" id="cm-parent-id" value="">
                            <input type="hidden" id="cm-cat-id" value="">

                            <div class="form-group">
                                <label class="form-label">Tên Thể Loại <span class="required-mark">*</span></label>
                                <input type="text" id="cm-name" class="form-input" required placeholder="Ví dụ: AI & Machine Learning">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Biểu Tượng FontAwesome</label>
                                <input type="text" id="cm-icon" class="form-input" value="fa-solid fa-bookmark" placeholder="fa-solid fa-code">
                            </div>

                            <div class="modal-footer px-0 pb-0">
                                <button type="button" class="btn btn-ghost" onclick="modalManager.close('cat-form-modal')">Huỷ</button>
                                <button type="submit" class="btn btn-primary">Lưu Thể Loại</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.renderActiveTab();
    },

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.admin-sidebar-item').forEach(item => item.classList.remove('active'));
        this.renderActiveTab();
    },

    renderActiveTab() {
        const viewport = document.getElementById('admin-viewport');
        if (!viewport) return;

        if (this.activeTab === 'dashboard') {
            this.renderDashboard(viewport);
        } else if (this.activeTab === 'books') {
            this.renderBooksManagement(viewport);
        } else if (this.activeTab === 'categories') {
            this.renderCategoryTreeManagement(viewport);
        } else if (this.activeTab === 'authors_pubs') {
            this.renderAuthorsPublishers(viewport);
        } else if (this.activeTab === 'orders') {
            this.renderOrdersManagement(viewport);
        }
    },

    // 1. Dashboard View
    renderDashboard(container) {
        const stats = store.getAdminStats();

        container.innerHTML = `
            <div class="d-flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Tổng Quan Doanh Thu & Đơn Hàng</h1>
                    <p class="text-xs text-muted mt-1">Báo cáo hiệu suất kinh doanh thời gian thực hệ thống BookNest.</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="adminPage.openBookModal()">
                        <i class="fa-solid fa-plus mr-1"></i> Thêm Sách Mới
                    </button>
                </div>
            </div>

            <!-- 4 KPI Stat Cards -->
            <div class="admin-stats-grid">
                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Tổng Doanh Thu</div>
                        <div class="stat-value">${store.formatCurrency(stats.totalRevenue)}</div>
                        <div class="stat-trend positive"><i class="fa-solid fa-arrow-trend-up"></i> +18.4% so với tháng trước</div>
                    </div>
                    <div class="stat-icon-box stat-icon-blue"><i class="fa-solid fa-sack-dollar"></i></div>
                </div>

                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Tổng Đơn Hàng</div>
                        <div class="stat-value">${stats.monthlyOrders}</div>
                        <div class="stat-trend positive"><i class="fa-solid fa-arrow-trend-up"></i> +12.5% tăng trưởng</div>
                    </div>
                    <div class="stat-icon-box stat-icon-green"><i class="fa-solid fa-truck-ramp-box"></i></div>
                </div>

                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Sách Trong Kho</div>
                        <div class="stat-value">${stats.totalBooksInStock}</div>
                        <div class="stat-trend text-muted"><i class="fa-solid fa-boxes-stacked"></i> ${store.getBooks().length} đầu sách</div>
                    </div>
                    <div class="stat-icon-box stat-icon-amber"><i class="fa-solid fa-book-bookmark"></i></div>
                </div>

                <div class="stat-card">
                    <div class="stat-info">
                        <div class="stat-label">Khách Hàng Đăng Ký</div>
                        <div class="stat-value">${stats.activeCustomers}</div>
                        <div class="stat-trend positive"><i class="fa-solid fa-user-plus"></i> +34 người mới tuần này</div>
                    </div>
                    <div class="stat-icon-box stat-icon-purple"><i class="fa-solid fa-users"></i></div>
                </div>
            </div>

            <!-- Charts Grid -->
            <div class="dashboard-charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <div>
                            <h3 class="font-bold text-base">Biểu Đồ Doanh Thu 12 Tháng (Triệu VNĐ)</h3>
                            <p class="text-xs text-muted">Thống kê doanh số bán sách năm 2026</p>
                        </div>
                        <span class="badge badge-primary">Năm 2026</span>
                    </div>
                    <div class="chart-canvas-wrapper">
                        <canvas id="revenue-line-chart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <div>
                            <h3 class="font-bold text-base">Cơ Cấu Thể Loại Sách</h3>
                            <p class="text-xs text-muted">Tỷ trọng doanh thu theo chuyên mục</p>
                        </div>
                    </div>
                    <div class="chart-canvas-wrapper">
                        <canvas id="category-donut-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Recent Orders Table -->
            <div class="admin-card-container">
                <div class="d-flex items-center justify-between mb-4">
                    <h3 class="font-bold text-base">Đơn Hàng Mới Nhất</h3>
                    <button class="btn btn-ghost btn-sm text-primary" onclick="adminPage.switchTab('orders')">Xem tất cả đơn →</button>
                </div>
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead>
                            <tr>
                                <th>Mã Đơn</th>
                                <th>Khách Hàng</th>
                                <th>Ngày Đặt</th>
                                <th>Tổng Tiền</th>
                                <th>Phương Thức</th>
                                <th>Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.recentOrders.map(o => `
                                <tr>
                                    <td><strong class="text-primary">#${o.id}</strong></td>
                                    <td>${o.customerName}</td>
                                    <td>${store.formatDate(o.orderDate)}</td>
                                    <td><strong>${store.formatCurrency(o.totalAmount)}</strong></td>
                                    <td><span class="badge ${o.paymentMethod === 'VIETQR' ? 'badge-primary' : 'badge-subtle'}">${o.paymentMethod}</span></td>
                                    <td><span class="badge ${o.orderStatus === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">${o.orderStatus}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        setTimeout(() => {
            chartRenderer.renderRevenueLineChart('revenue-line-chart', stats.monthlyRevenueData);
            chartRenderer.renderCategoryDonutChart('category-donut-chart', stats.categoryRevenueBreakdown);
        }, 50);
    },

    // 2. Books Management View
    renderBooksManagement(container) {
        const books = store.getBooks();

        container.innerHTML = `
            <div class="d-flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Quản Lý Danh Mục Sách</h1>
                    <p class="text-xs text-muted mt-1">Danh sách ${books.length} đầu sách hiện có trong hệ thống.</p>
                </div>
                <button class="btn btn-primary" onclick="adminPage.openBookModal()">
                    <i class="fa-solid fa-plus mr-1"></i> Thêm Sách Mới
                </button>
            </div>

            <div class="admin-card-container">
                <div class="data-table-toolbar">
                    <div class="input-with-icon" style="max-width: 320px;">
                        <i class="fa-solid fa-magnifying-glass input-icon"></i>
                        <input type="text" id="admin-book-search" class="form-input" placeholder="Tìm tên sách hoặc tác giả..." oninput="adminPage.filterBookTable(this.value)">
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="admin-data-table" id="admin-books-table">
                        <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Tựa Đề Sách</th>
                                <th>Tác Giả</th>
                                <th>Thể Loại</th>
                                <th>Giá Bán</th>
                                <th>Kho</th>
                                <th>Đã Bán</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${books.map(b => `
                                <tr>
                                    <td><img src="${b.coverImage}" alt="${b.title}" class="table-img-thumb"></td>
                                    <td>
                                        <div class="font-bold text-truncate" style="max-width: 240px;" title="${b.title}">${b.title}</div>
                                        <span class="text-xs text-muted">NXB: ${b.publisherName}</span>
                                    </td>
                                    <td>${b.authorName}</td>
                                    <td><span class="badge badge-primary">${b.categoryName}</span></td>
                                    <td><strong class="text-primary">${store.formatCurrency(b.price)}</strong></td>
                                    <td>${b.stock} cuốn</td>
                                    <td>${b.soldCount || 0}</td>
                                    <td>
                                        <div class="table-actions-cell">
                                            <button class="btn btn-xs btn-ghost text-primary" title="Sửa" onclick="adminPage.openBookModal('${b.id}')">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button class="btn btn-xs btn-ghost text-danger" title="Xoá" onclick="adminPage.deleteBook('${b.id}')">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
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

    // 3. Category Tree View Management (Dạng cây)
    renderCategoryTreeManagement(container) {
        const categories = store.getCategories();

        container.innerHTML = `
            <div class="d-flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Quản Lý Thể Loại (Cấu Trúc Cây)</h1>
                    <p class="text-xs text-muted mt-1">Phân cấp danh mục đa tầng dạng cây (Parent - Children) trực quan.</p>
                </div>
                <button class="btn btn-primary" onclick="adminPage.openCategoryModal(null, null)">
                    <i class="fa-solid fa-folder-plus mr-1"></i> Thêm Thể Loại Gốc
                </button>
            </div>

            <div class="category-tree-wrapper">
                <div class="tree-root-list" id="category-tree-root">
                    ${categories.map(cat => this.renderCategoryTreeNode(cat)).join('')}
                </div>
            </div>
        `;
    },

    renderCategoryTreeNode(cat) {
        const hasChildren = cat.children && cat.children.length > 0;
        return `
            <div class="tree-node-item" id="node-${cat.id}">
                <div class="tree-node-content">
                    <div class="tree-node-title">
                        ${hasChildren ? `
                            <button class="tree-toggle-btn expanded" onclick="adminPage.toggleTreeNode('${cat.id}', this)">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        ` : `<span style="width: 24px;"></span>`}
                        <i class="${cat.icon || 'fa-solid fa-folder'} text-primary mr-1"></i>
                        <span>${cat.name}</span>
                        ${hasChildren ? `<span class="badge badge-subtle ml-2 text-xs">${cat.children.length} nhánh con</span>` : ''}
                    </div>

                    <div class="d-flex items-center gap-2">
                        <button class="btn btn-xs btn-outline-primary" title="Thêm danh mục con" onclick="adminPage.openCategoryModal(null, '${cat.id}')">
                            <i class="fa-solid fa-plus mr-1"></i> Thêm Con
                        </button>
                        <button class="btn btn-xs btn-ghost text-primary" title="Sửa tên" onclick="adminPage.openCategoryModal('${cat.id}', '${cat.parentId || ''}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-xs btn-ghost text-danger" title="Xoá" onclick="adminPage.deleteCategory('${cat.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                ${hasChildren ? `
                    <div class="tree-children-container" id="children-${cat.id}">
                        ${cat.children.map(child => this.renderCategoryTreeNode(child)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    toggleTreeNode(catId, btn) {
        const childrenContainer = document.getElementById(`children-${catId}`);
        if (childrenContainer) {
            childrenContainer.classList.toggle('hidden');
            btn.classList.toggle('expanded');
        }
    },

    // 4. Authors & Publishers Management
    renderAuthorsPublishers(container) {
        const authors = store.getAuthors();
        const publishers = store.getPublishers();

        container.innerHTML = `
            <div class="d-flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Quản Lý Tác Giả & Nhà Xuất Bản</h1>
                    <p class="text-xs text-muted mt-1">Danh sách đối tác xuất bản và các tác giả cộng tác.</p>
                </div>
            </div>

            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 2rem;">
                <!-- Authors List -->
                <div class="admin-card-container">
                    <div class="d-flex items-center justify-between mb-4">
                        <h3 class="font-bold text-base"><i class="fa-solid fa-feather text-primary mr-1"></i> Tác Giả (${authors.length})</h3>
                        <button class="btn btn-xs btn-primary" onclick="adminPage.promptAddAuthor()">+ Thêm Tác Giả</button>
                    </div>
                    <div class="d-flex flex-column gap-3">
                        ${authors.map(a => `
                            <div class="d-flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                <div class="d-flex items-center gap-3">
                                    <img src="${a.avatar}" alt="${a.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
                                    <div>
                                        <div class="font-bold text-sm">${a.name}</div>
                                        <div class="text-xs text-muted">${a.nationality}</div>
                                    </div>
                                </div>
                                <button class="btn btn-xs btn-ghost text-danger" onclick="store.deleteAuthor('${a.id}'); adminPage.renderActiveTab();"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Publishers List -->
                <div class="admin-card-container">
                    <div class="d-flex items-center justify-between mb-4">
                        <h3 class="font-bold text-base"><i class="fa-solid fa-building text-primary mr-1"></i> Nhà Xuất Bản (${publishers.length})</h3>
                        <button class="btn btn-xs btn-primary" onclick="adminPage.promptAddPublisher()">+ Thêm NXB</button>
                    </div>
                    <div class="d-flex flex-column gap-3">
                        ${publishers.map(p => `
                            <div class="d-flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                <div>
                                    <div class="font-bold text-sm text-primary">${p.name} (${p.code})</div>
                                    <div class="text-xs text-muted">${p.address || ''}</div>
                                </div>
                                <button class="btn btn-xs btn-ghost text-danger" onclick="store.deletePublisher('${p.id}'); adminPage.renderActiveTab();"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // 5. Orders Management
    renderOrdersManagement(container) {
        const orders = store.getAllOrders();

        container.innerHTML = `
            <div class="d-flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Quản Lý Đơn Hàng</h1>
                    <p class="text-xs text-muted mt-1">Danh sách tất cả các đơn hàng từ khách.</p>
                </div>
            </div>

            <div class="admin-card-container">
                <div class="table-responsive">
                    <table class="admin-data-table">
                        <thead>
                            <tr>
                                <th>Mã Đơn</th>
                                <th>Khách Hàng</th>
                                <th>Số ĐT</th>
                                <th>Ngày Đặt</th>
                                <th>Tổng Tiền</th>
                                <th>Phương Thức</th>
                                <th>Trạng Thái</th>
                                <th>Cập Nhật</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(o => `
                                <tr>
                                    <td><strong class="text-primary">#${o.id}</strong></td>
                                    <td>${o.customerName}</td>
                                    <td>${o.customerPhone || 'N/A'}</td>
                                    <td>${store.formatDate(o.orderDate)}</td>
                                    <td><strong class="text-primary">${store.formatCurrency(o.totalAmount)}</strong></td>
                                    <td><span class="badge badge-primary">${o.paymentMethod}</span></td>
                                    <td><span class="badge ${o.orderStatus === 'COMPLETED' ? 'badge-success' : (o.orderStatus === 'CANCELLED' ? 'badge-danger' : 'badge-warning')}">${o.orderStatus}</span></td>
                                    <td>
                                        <select class="form-select form-select-sm" style="padding: 0.25rem 0.5rem; width: auto;" onchange="store.updateOrderStatus('${o.id}', this.value); appToast.success('Cập nhật trạng thái đơn hàng thành công!'); adminPage.renderActiveTab();">
                                            <option value="PROCESSING" ${o.orderStatus === 'PROCESSING' ? 'selected' : ''}>Đang Xử Lý</option>
                                            <option value="SHIPPING" ${o.orderStatus === 'SHIPPING' ? 'selected' : ''}>Đang Giao</option>
                                            <option value="COMPLETED" ${o.orderStatus === 'COMPLETED' ? 'selected' : ''}>Hoàn Thành</option>
                                            <option value="CANCELLED" ${o.orderStatus === 'CANCELLED' ? 'selected' : ''}>Đã Huỷ</option>
                                        </select>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // Modal Form Logic for Books
    openBookModal(bookId = null) {
        this.editingBookId = bookId;
        const categories = store.getCategories();
        const authors = store.getAuthors();
        const publishers = store.getPublishers();

        // Populate Dropdowns
        const catSelect = document.getElementById('bm-category');
        catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        const authSelect = document.getElementById('bm-author');
        authSelect.innerHTML = authors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

        const pubSelect = document.getElementById('bm-publisher');
        pubSelect.innerHTML = publishers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        const modalTitle = document.getElementById('book-modal-title');

        if (bookId) {
            const book = store.getBooks().find(b => b.id === bookId);
            modalTitle.textContent = `Chỉnh Sửa Sách: ${book.title}`;
            document.getElementById('bm-title').value = book.title;
            document.getElementById('bm-category').value = book.categoryId;
            document.getElementById('bm-author').value = book.authorId;
            document.getElementById('bm-publisher').value = book.publisherId;
            document.getElementById('bm-price').value = book.price;
            document.getElementById('bm-orig-price').value = book.originalPrice || '';
            document.getElementById('bm-stock').value = book.stock || 50;
            document.getElementById('bm-pages').value = book.pages || 300;
            document.getElementById('bm-year').value = book.publishYear || 2024;
            document.getElementById('bm-isbn').value = book.isbn || '';
            document.getElementById('bm-description').value = book.description || '';

            // Image Preview
            this.setImagePreview(book.coverImage);
        } else {
            modalTitle.textContent = "Thêm Sách Mới Vào Kho";
            document.getElementById('admin-book-form').reset();
            this.clearUploadedImage();
        }

        modalManager.open('book-form-modal');
    },

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.setImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    },

    setImagePreview(url) {
        const previewBox = document.getElementById('bm-image-preview-container');
        const previewImg = document.getElementById('bm-image-preview');
        const urlInput = document.getElementById('bm-image-url');

        if (url) {
            previewImg.src = url;
            urlInput.value = url;
            previewBox.classList.remove('d-none');
        }
    },

    clearUploadedImage() {
        const previewBox = document.getElementById('bm-image-preview-container');
        const previewImg = document.getElementById('bm-image-preview');
        const urlInput = document.getElementById('bm-image-url');
        const fileInput = document.getElementById('bm-file-input');

        if (previewImg) previewImg.src = '';
        if (urlInput) urlInput.value = '';
        if (fileInput) fileInput.value = '';
        if (previewBox) previewBox.classList.add('d-none');
    },

    async handleSaveBook(e) {
        e.preventDefault();
        const title = document.getElementById('bm-title').value.trim();
        const categoryId = document.getElementById('bm-category').value;
        const authorId = document.getElementById('bm-author').value;
        const publisherId = document.getElementById('bm-publisher').value;
        const price = parseInt(document.getElementById('bm-price').value) || 0;
        const origPrice = parseInt(document.getElementById('bm-orig-price').value) || price;
        const stock = parseInt(document.getElementById('bm-stock').value) || 50;
        const pages = parseInt(document.getElementById('bm-pages').value) || 300;
        const publishYear = parseInt(document.getElementById('bm-year').value) || 2025;
        const isbn = document.getElementById('bm-isbn').value.trim();
        const description = document.getElementById('bm-description').value.trim();
        const coverImage = document.getElementById('bm-image-url').value.trim() || "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80";

        const category = store.getCategories().find(c => c.id === categoryId);
        const author = store.getAuthors().find(a => a.id === authorId);
        const publisher = store.getPublishers().find(p => p.id === publisherId);

        const bookPayload = {
            title,
            categoryId,
            categoryName: category ? category.name : 'Khác',
            authorId,
            authorName: author ? author.name : 'Khác',
            publisherId,
            publisherName: publisher ? publisher.name : 'Khác',
            price,
            originalPrice: origPrice,
            discountPercent: origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0,
            stock,
            pages,
            publishYear,
            isbn,
            description,
            coverImage
        };

        try {
            if (this.editingBookId) {
                await ApiService.books.update(this.editingBookId, bookPayload);
                appToast.success('Cập nhật thông tin sách thành công!');
            } else {
                await ApiService.books.create(bookPayload);
                appToast.success('Đã thêm cuốn sách mới vào kho!');
            }

            modalManager.close('book-form-modal');
            this.renderActiveTab();
        } catch (err) {
            appToast.error(err.message || 'Lỗi khi lưu sách.');
        }
    },

    deleteBook(bookId) {
        modalManager.confirm({
            title: 'Xoá Sách Khỏi Kho',
            message: 'Bạn có chắc chắn muốn xoá cuốn sách này không?',
            onConfirm: async () => {
                await ApiService.books.delete(bookId);
                appToast.info('Đã xoá sách khỏi danh mục.');
                this.renderActiveTab();
            }
        });
    },

    // Category Modal Logic
    openCategoryModal(catId = null, parentId = null) {
        document.getElementById('cm-cat-id').value = catId || '';
        document.getElementById('cm-parent-id').value = parentId || '';

        const titleEl = document.getElementById('cat-modal-title');
        if (catId) {
            const cat = store.getCategories().find(c => c.id === catId);
            titleEl.textContent = "Chỉnh Sửa Thể Loại";
            document.getElementById('cm-name').value = cat ? cat.name : '';
            document.getElementById('cm-icon').value = cat ? (cat.icon || 'fa-solid fa-folder') : 'fa-solid fa-folder';
        } else {
            titleEl.textContent = parentId ? "Thêm Thể Loại Con" : "Thêm Thể Loại Gốc";
            document.getElementById('cm-name').value = '';
            document.getElementById('cm-icon').value = 'fa-solid fa-folder';
        }

        modalManager.open('cat-form-modal');
    },

    async handleSaveCategory(e) {
        e.preventDefault();
        const catId = document.getElementById('cm-cat-id').value;
        const parentId = document.getElementById('cm-parent-id').value;
        const name = document.getElementById('cm-name').value.trim();
        const icon = document.getElementById('cm-icon').value.trim();

        if (catId) {
            await ApiService.categories.update(catId, { name, icon });
            appToast.success('Đã cập nhật thể loại!');
        } else {
            await ApiService.categories.create({ name, icon, parentId: parentId || null });
            appToast.success('Đã thêm thể loại mới vào cây danh mục!');
        }

        modalManager.close('cat-form-modal');
        this.renderActiveTab();
    },

    deleteCategory(catId) {
        modalManager.confirm({
            title: 'Xoá Thể Loại',
            message: 'Xoá thể loại này sẽ xoá toàn bộ danh mục con thuộc nó. Bạn có chắc chắn?',
            onConfirm: async () => {
                await ApiService.categories.delete(catId);
                appToast.info('Đã xoá nhánh thể loại.');
                this.renderActiveTab();
            }
        });
    },

    promptAddAuthor() {
        const name = prompt("Nhập họ tên Tác giả:");
        if (name) {
            const nationality = prompt("Nhập quốc tịch (VD: Việt Nam, Mỹ...):") || "Việt Nam";
            store.addAuthor({
                name,
                nationality,
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                bio: "Tác giả uy tín hợp tác cùng BookNest."
            });
            appToast.success(`Đã thêm tác giả ${name}`);
            this.renderActiveTab();
        }
    },

    promptAddPublisher() {
        const name = prompt("Nhập tên Nhà Xuất Bản:");
        if (name) {
            const code = prompt("Nhập mã NXB (VD: NXBTRE, KIMDONG...):") || "NXB";
            store.addPublisher({
                name,
                code: code.toUpperCase(),
                address: "TP. Hồ Chí Minh",
                phone: "1900 6868"
            });
            appToast.success(`Đã thêm nhà xuất bản ${name}`);
            this.renderActiveTab();
        }
    },

    filterBookTable(keyword) {
        const kw = keyword.toLowerCase();
        const rows = document.querySelectorAll('#admin-books-table tbody tr');
        rows.forEach(r => {
            const text = r.textContent.toLowerCase();
            r.style.display = text.includes(kw) ? '' : 'none';
        });
    }
};
