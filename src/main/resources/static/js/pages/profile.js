/**
 * USER PROFILE & ACCOUNT HUB CONTROLLER (Trang cá nhân)
 * Order tracking, Address Book, 5 Favorite Genres management, personal info & password.
 */

const profilePage = {
    activeTab: 'orders',
    orders: [],
    addresses: [],
    cancelOrderId: null,

    orderStatusBadges: {
        PENDING: '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Chờ Xử Lý</span>',
        CONFIRMED: '<span class="badge badge-info"><i class="fa-solid fa-clipboard-check"></i> Đã Xác Nhận</span>',
        PROCESSING: '<span class="badge badge-info"><i class="fa-solid fa-box"></i> Đang Chuẩn Bị</span>',
        SHIPPING: '<span class="badge badge-info"><i class="fa-solid fa-truck-fast"></i> Đang Giao Hàng</span>',
        DELIVERED: '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Đã Giao Thành Công</span>',
        CANCELLED: '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Đã Huỷ</span>',
        RETURNED: '<span class="badge badge-subtle"><i class="fa-solid fa-rotate-left"></i> Đã Trả Hàng</span>'
    },

    paymentLabels: { COD: 'Tiền mặt (COD)', QR_CODE: 'Chuyển khoản VietQR', BANKING: 'Chuyển khoản', MOMO: 'MoMo', VNPAY: 'VNPay', STRIPE: 'Thẻ quốc tế' },

    async render(container, queryParams = {}) {
        if (!app.requireLogin('Vui lòng đăng nhập để xem tài khoản!')) return;

        this.activeTab = queryParams.tab || 'orders';
        const stillHere = app.routeChecker();
        try {
            const [orders, addresses, me] = await Promise.all([
                ApiService.orders.list(), ApiService.addresses.list(), ApiService.auth.me()
            ]);
            store.setUser(me); // điểm thưởng/thông tin mới nhất
            this.orders = orders.items;
            this.addresses = addresses;
        } catch (err) {
            if (stillHere()) app.showError(err);
            return;
        }
        if (!stillHere()) return;
        this.draw(container);
    },

    draw(container) {
        const user = store.currentUser;
        const orders = this.orders;
        const favoriteCategoryIds = store.getFavoriteCategories();
        const favoriteCategories = store.getCategories().filter(c => favoriteCategoryIds.includes(c.id));
        const roleLabel = user.role === 'ADMIN' ? 'Quản Trị Viên' : user.role === 'STAFF' ? 'Nhân Viên' : 'Khách Hàng';

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Tài Khoản Của Tôi</span>
                </div>

                <div class="profile-layout">
                    <!-- Left Sidebar -->
                    <aside class="profile-sidebar">
                        <div class="profile-user-summary">
                            <div class="profile-avatar-large">${esc(user.name.charAt(0))}</div>
                            <h3 class="font-bold text-base mb-1">${esc(user.name)}</h3>
                            <p class="text-xs text-muted mb-2">${esc(user.email)}</p>
                            <span class="badge ${store.canAdmin ? 'badge-primary' : 'badge-subtle'}">${roleLabel}</span>
                            <div class="text-xs text-muted mt-2"><i class="fa-solid fa-star text-warning"></i> ${user.loyaltyPoints} điểm tích luỹ</div>
                        </div>

                        <nav class="profile-nav-menu">
                            <div class="profile-nav-item ${this.activeTab === 'orders' ? 'active' : ''}" onclick="profilePage.switchTab('orders')">
                                <i class="fa-solid fa-box-archive"></i> Đơn Hàng Của Tôi (${orders.length})
                            </div>
                            <div class="profile-nav-item ${this.activeTab === 'favorites' ? 'active' : ''}" onclick="profilePage.switchTab('favorites')">
                                <i class="fa-solid fa-heart-pulse"></i> 5 Thể Loại Yêu Thích
                            </div>
                            <div class="profile-nav-item ${this.activeTab === 'addresses' ? 'active' : ''}" onclick="profilePage.switchTab('addresses')">
                                <i class="fa-solid fa-map-location-dot"></i> Sổ Địa Chỉ Giao Hàng
                            </div>
                            <div class="profile-nav-item ${this.activeTab === 'info' ? 'active' : ''}" onclick="profilePage.switchTab('info')">
                                <i class="fa-solid fa-user-pen"></i> Thông Tin Cá Nhân
                            </div>
                            <div class="profile-nav-item danger-item text-danger mt-3" onclick="store.logout(); appToast.info('Đã đăng xuất thành công!'); app.navigate('#/auth');">
                                <i class="fa-solid fa-right-from-bracket"></i> Đăng Xuất
                            </div>
                        </nav>
                    </aside>

                    <!-- Right Main Content -->
                    <main class="profile-content-card">
                        <!-- Tab 1: Orders -->
                        <div id="p-tab-orders" class="${this.activeTab === 'orders' ? '' : 'd-none'}">
                            <div class="d-flex items-center justify-between mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">
                                <h2 class="text-xl font-bold">Lịch Sử Đơn Hàng</h2>
                                <span class="text-xs text-muted font-semibold">Tổng số: ${orders.length} đơn</span>
                            </div>

                            ${orders.length === 0 ? `
                                <div class="text-center py-8 text-muted">
                                    <i class="fa-solid fa-box-open mb-2" style="font-size: 2.5rem;"></i>
                                    <p>Bạn chưa có đơn hàng nào tại BookNest.</p>
                                    <a href="#/catalog" class="btn btn-primary btn-sm mt-3">Mua sắm ngay</a>
                                </div>
                            ` : orders.map(order => this.renderOrderCard(order)).join('')}
                        </div>

                        <!-- Tab 2: 5 Favorite Categories -->
                        <div id="p-tab-favorites" class="${this.activeTab === 'favorites' ? '' : 'd-none'}">
                            <div class="d-flex items-center justify-between mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">
                                <div>
                                    <h2 class="text-xl font-bold">5 Thể Loại Sách Bạn Yêu Thích</h2>
                                    <p class="text-xs text-muted mt-1">BookNest dựa vào các sở thích này để gợi ý những cuốn sách phù hợp nhất cho bạn.</p>
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="favoriteGenresModal.open()">
                                    <i class="fa-solid fa-pen-to-square mr-1"></i> Chỉnh Sửa 5 Thể Loại
                                </button>
                            </div>

                            ${favoriteCategories.length === 0 ? `
                                <div class="text-center py-6 text-muted text-sm">Bạn chưa chọn thể loại yêu thích nào. Bấm "Chỉnh Sửa 5 Thể Loại" để chọn.</div>
                            ` : `
                            <div class="d-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
                                ${favoriteCategories.map(cat => `
                                    <div class="p-4 text-center rounded-lg" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                        <div class="text-2xl text-primary mb-2"><i class="${esc(cat.icon || 'fa-solid fa-book')}"></i></div>
                                        <div class="font-bold text-sm mb-1">${esc(cat.name)}</div>
                                        <a href="#/catalog?category=${cat.id}" class="text-xs text-primary font-semibold hover-underline">Xem sách thuộc thể loại →</a>
                                    </div>
                                `).join('')}
                            </div>`}

                            <div class="mt-6 p-4 rounded-lg d-flex items-center justify-between" style="background: var(--primary-light); color: var(--primary);">
                                <div class="d-flex items-center gap-3">
                                    <i class="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                                    <div>
                                        <div class="font-bold text-sm">Xem ngay danh sách đề xuất dành riêng cho bạn!</div>
                                        <div class="text-xs">Được cá nhân hoá theo thể loại bạn chọn.</div>
                                    </div>
                                </div>
                                <a href="#/recommendations" class="btn btn-primary btn-sm">Xem Gợi Ý Ngay</a>
                            </div>
                        </div>

                        <!-- Tab 3: Addresses -->
                        <div id="p-tab-addresses" class="${this.activeTab === 'addresses' ? '' : 'd-none'}">
                            <div class="d-flex items-center justify-between mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">
                                <h2 class="text-xl font-bold">Sổ Địa Chỉ Giao Hàng</h2>
                                <button class="btn btn-primary btn-sm" onclick="profilePage.openAddressModal()">
                                    <i class="fa-solid fa-plus mr-1"></i> Thêm Địa Chỉ Mới
                                </button>
                            </div>

                            ${this.addresses.length === 0 ? '<div class="text-center py-6 text-muted text-sm">Chưa có địa chỉ nào. Thêm địa chỉ để đặt hàng nhanh hơn.</div>' : ''}
                            ${this.addresses.map(addr => `
                                <div class="p-4 rounded-lg mb-3 d-flex items-start justify-between gap-3" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                    <div>
                                        <div class="d-flex items-center gap-2 mb-1">
                                            <strong class="font-bold text-sm">${esc(addr.recipientName)}</strong>
                                            <span class="text-xs text-muted">| ${esc(addr.phone)}</span>
                                            ${addr.isDefault ? '<span class="badge badge-success">Mặc Định</span>' : ''}
                                        </div>
                                        <p class="text-sm text-muted">${esc([addr.detailAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(', '))}</p>
                                    </div>
                                    <div class="d-flex gap-2">
                                        ${addr.isDefault ? '' : `<button class="btn btn-xs btn-ghost text-primary" title="Đặt làm mặc định" onclick="profilePage.setDefaultAddress('${addr.id}')"><i class="fa-solid fa-star"></i></button>`}
                                        <button class="btn btn-xs btn-ghost text-primary" title="Sửa" onclick="profilePage.openAddressModal('${addr.id}')"><i class="fa-solid fa-pen"></i></button>
                                        <button class="btn btn-xs btn-ghost text-danger" title="Xoá" onclick="profilePage.deleteAddress('${addr.id}')"><i class="fa-solid fa-trash-can"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Tab 4: Info + Password -->
                        <div id="p-tab-info" class="${this.activeTab === 'info' ? '' : 'd-none'}">
                            <h2 class="text-xl font-bold mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">Cập Nhật Thông Tin Cá Nhân</h2>
                            <form onsubmit="profilePage.handleSaveInfo(event)">
                                <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label">Họ và tên <span class="required-mark">*</span></label>
                                        <input type="text" id="info-name" class="form-input" required value="${esc(user.fullName || user.name)}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Email tài khoản</label>
                                        <input type="email" class="form-input" value="${esc(user.email)}" readonly disabled>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Số điện thoại</label>
                                    <input type="tel" id="info-phone" class="form-input" placeholder="0912 345 678" value="${esc(user.phone || '')}">
                                </div>
                                <button type="submit" class="btn btn-primary mt-2">
                                    <i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Thay Đổi
                                </button>
                            </form>

                            <div class="mt-6">
                                <h2 class="text-xl font-bold mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">Đổi Mật Khẩu</h2>
                                <form onsubmit="profilePage.handleChangePassword(event)">
                                    <div class="form-group">
                                        <label class="form-label">Mật khẩu hiện tại <span class="required-mark">*</span></label>
                                        <div class="password-input-wrap input-with-icon">
                                            <i class="fa-solid fa-lock input-icon"></i>
                                            <input type="password" id="current-password" class="form-input" required>
                                        </div>
                                    </div>
                                    <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                        <div class="form-group">
                                            <label class="form-label">Mật khẩu mới <span class="required-mark">*</span></label>
                                            <div class="password-input-wrap input-with-icon">
                                                <i class="fa-solid fa-lock input-icon"></i>
                                                <input type="password" id="new-password" class="form-input" required minlength="6">
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Nhập lại mật khẩu mới <span class="required-mark">*</span></label>
                                            <div class="password-input-wrap input-with-icon">
                                                <i class="fa-solid fa-lock input-icon"></i>
                                                <input type="password" id="new-repassword" class="form-input" required minlength="6">
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-warning mt-2">
                                        <i class="fa-solid fa-key mr-1"></i> Cập Nhật Mật Khẩu
                                    </button>
                                </form>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <!-- Address Modal -->
            <div id="address-modal" class="modal-overlay hidden">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h4 class="modal-title font-bold" id="address-modal-title">Thêm Địa Chỉ Mới</h4>
                        <button type="button" class="modal-close-btn" onclick="modalManager.close('address-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form onsubmit="profilePage.handleSaveAddress(event)">
                        <div class="modal-body text-left">
                            <input type="hidden" id="addr-id">
                            <div class="form-group">
                                <label class="form-label">Họ và tên người nhận <span class="required-mark">*</span></label>
                                <input type="text" id="addr-name" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Số điện thoại <span class="required-mark">*</span></label>
                                <input type="tel" id="addr-phone" class="form-input" required>
                            </div>
                            <div class="d-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                                <div class="form-group">
                                    <label class="form-label">Tỉnh / TP <span class="required-mark">*</span></label>
                                    <input type="text" id="addr-province" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Quận / Huyện <span class="required-mark">*</span></label>
                                    <input type="text" id="addr-district" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Phường / Xã</label>
                                    <input type="text" id="addr-ward" class="form-input">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Số nhà, tên đường <span class="required-mark">*</span></label>
                                <input type="text" id="addr-detail" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-checkbox-label text-sm font-semibold">
                                    <input type="checkbox" id="addr-default"> Đặt làm địa chỉ mặc định
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-ghost btn-sm" onclick="modalManager.close('address-modal')">Huỷ Bỏ</button>
                            <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Địa Chỉ</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Cancel Order Modal -->
            <div id="cancel-order-modal" class="modal-overlay hidden">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h4 class="modal-title font-bold">Huỷ Đơn Hàng</h4>
                        <button type="button" class="modal-close-btn" onclick="modalManager.close('cancel-order-modal')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form onsubmit="profilePage.handleCancelOrder(event)">
                        <div class="modal-body text-left">
                            <p class="text-sm mb-3" id="cancel-order-text"></p>
                            <div class="form-group mb-0">
                                <label class="form-label">Lý do huỷ <span class="required-mark">*</span></label>
                                <textarea id="cancel-order-reason" class="form-input" rows="3" required placeholder="Ví dụ: Đặt nhầm sách, muốn đổi địa chỉ..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-ghost btn-sm" onclick="modalManager.close('cancel-order-modal')">Giữ Đơn</button>
                            <button type="submit" class="btn btn-danger btn-sm">Xác Nhận Huỷ</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderOrderCard(order) {
        const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED';
        const awaitingQr = order.orderStatus === 'PENDING' && order.paymentMethod === 'QR_CODE' && order.paymentStatus === 'PENDING';
        const paidBadge = order.paymentStatus === 'SUCCESS'
            ? '<span class="badge badge-success ml-1">Đã thanh toán</span>'
            : order.paymentStatus === 'REFUNDED' ? '<span class="badge badge-subtle ml-1">Đã hoàn tiền</span>' : '';

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <span class="font-bold text-sm text-primary">#${esc(order.orderCode)}</span>
                        <span class="text-xs text-muted ml-2">${store.formatDate(order.orderDate)}</span>
                    </div>
                    <div>${this.orderStatusBadges[order.orderStatus] || '<span class="badge badge-subtle">Chờ Xử Lý</span>'}</div>
                </div>

                <div class="order-book-preview-list">
                    ${order.items.map(item => `
                        <div class="order-book-item">
                            <div class="d-flex items-center gap-2">
                                <img src="${esc(item.coverImage)}" alt="${esc(item.title)}" style="width: 36px; height: 48px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.onerror=null; this.src=app.getBookPlaceholder(this.alt, '');">
                                <div>
                                    <a href="#/book/${item.bookId}" class="font-bold text-xs text-truncate d-block hover-underline" style="max-width: 280px;">${esc(item.title)}</a>
                                    <span class="text-xs text-muted">${item.quantity} cuốn x ${store.formatCurrency(item.price)}</span>
                                </div>
                            </div>
                            <span class="font-bold text-xs">${store.formatCurrency(item.subtotal)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="text-xs text-muted pt-3 mt-3" style="border-top: 1px solid var(--border-subtle);">
                    <div class="d-flex justify-between py-1"><span>Tạm tính:</span><span>${store.formatCurrency(order.subtotal)}</span></div>
                    ${order.discountAmount > 0 ? `<div class="d-flex justify-between py-1"><span>Giảm giá${order.couponCode ? ` (${esc(order.couponCode)})` : ''}:</span><span class="text-success">-${store.formatCurrency(order.discountAmount)}</span></div>` : ''}
                    <div class="d-flex justify-between py-1"><span>Phí vận chuyển:</span><span>${order.shippingFee === 0 ? 'Miễn phí' : store.formatCurrency(order.shippingFee)}</span></div>
                    <div class="d-flex justify-between py-1"><span>Giao đến:</span><span class="text-truncate" style="max-width: 360px;">${esc(order.shippingAddress)}</span></div>
                </div>

                <div class="d-flex items-center justify-between pt-3 mt-2 flex-wrap gap-2" style="border-top: 1px solid var(--border-subtle);">
                    <div class="text-xs text-muted">
                        PTTT: <strong>${this.paymentLabels[order.paymentMethod] || esc(order.paymentMethod)}</strong>${paidBadge}
                    </div>
                    <div class="d-flex items-center gap-3 flex-wrap">
                        <div>Tổng tiền: <strong class="text-primary font-bold text-sm">${store.formatCurrency(order.totalAmount)}</strong></div>
                        ${awaitingQr ? '<a href="#/checkout" class="btn btn-xs btn-primary">Thanh Toán QR</a>' : ''}
                        ${canCancel ? `<button class="btn btn-xs btn-outline-danger" onclick="profilePage.openCancelOrder('${order.id}')">Huỷ Đơn</button>` : ''}
                        <button class="btn btn-xs btn-outline-primary" onclick="profilePage.reorder('${order.id}')">Mua Lại</button>
                    </div>
                </div>
            </div>
        `;
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.draw(document.getElementById('main-view'));
    },

    /* ------------------------------ Đơn hàng ------------------------------ */

    openCancelOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        this.cancelOrderId = orderId;
        document.getElementById('cancel-order-text').textContent = `Bạn muốn huỷ đơn #${order.orderCode}?`;
        document.getElementById('cancel-order-reason').value = '';
        modalManager.open('cancel-order-modal');
    },

    async handleCancelOrder(e) {
        e.preventDefault();
        const reason = document.getElementById('cancel-order-reason').value.trim();
        if (!reason) return;
        try {
            await ApiService.orders.cancel(this.cancelOrderId, reason);
            modalManager.close('cancel-order-modal');
            appToast.info('Đã huỷ đơn hàng thành công.');
            await this.reload();
        } catch (err) {
            app.showError(err);
        }
    },

    async reorder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        let added = 0;
        for (const item of order.items) {
            try {
                await store.addToCart(item.bookId, item.quantity);
                added++;
            } catch (err) {
                appToast.warning(`Không thêm được "${item.title}": ${err.message}`, 'Mua Lại');
            }
        }
        if (added > 0) {
            appToast.success('Đã thêm các món vào giỏ!');
            app.navigate('#/cart');
        }
    },

    /* ------------------------------ Địa chỉ ------------------------------ */

    openAddressModal(addrId = null) {
        const set = (id, value) => { document.getElementById(id).value = value; };
        const addr = addrId ? this.addresses.find(a => a.id === addrId) : null;

        document.getElementById('address-modal-title').textContent = addr ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới';
        set('addr-id', addr ? addr.id : '');
        set('addr-name', addr ? addr.recipientName : store.currentUser.name);
        set('addr-phone', addr ? addr.phone : store.currentUser.phone || '');
        set('addr-province', addr ? addr.province : '');
        set('addr-district', addr ? addr.district : '');
        set('addr-ward', addr ? addr.ward || '' : '');
        set('addr-detail', addr ? addr.detailAddress : '');
        document.getElementById('addr-default').checked = addr ? !!addr.isDefault : this.addresses.length === 0;
        modalManager.open('address-modal');
    },

    async handleSaveAddress(e) {
        e.preventDefault();
        const val = (id) => document.getElementById(id).value.trim();
        const id = val('addr-id');
        const body = {
            recipientName: val('addr-name'), phone: val('addr-phone'),
            province: val('addr-province'), district: val('addr-district'),
            ward: val('addr-ward'), detailAddress: val('addr-detail'),
            isDefault: document.getElementById('addr-default').checked
        };

        try {
            if (id) await ApiService.addresses.update(id, body);
            else await ApiService.addresses.create(body);
            modalManager.close('address-modal');
            appToast.success('Đã lưu thông tin địa chỉ thành công!');
            await this.reload('addresses');
        } catch (err) {
            app.showError(err);
        }
    },

    async setDefaultAddress(id) {
        try {
            await ApiService.addresses.setDefault(id);
            await this.reload('addresses');
        } catch (err) {
            app.showError(err);
        }
    },

    deleteAddress(id) {
        modalManager.confirm({
            title: 'Xoá Địa Chỉ',
            message: 'Bạn có chắc chắn muốn xoá địa chỉ này?',
            onConfirm: async () => {
                try {
                    await ApiService.addresses.remove(id);
                    appToast.info('Đã xoá địa chỉ.');
                    await this.reload('addresses');
                } catch (err) {
                    app.showError(err);
                }
            }
        });
    },

    // Tải lại dữ liệu rồi vẽ lại, giữ nguyên tab đang xem
    async reload(tab = this.activeTab) {
        await this.render(document.getElementById('main-view'), { tab });
    },

    /* --------------------------- Thông tin cá nhân --------------------------- */

    async handleSaveInfo(e) {
        e.preventDefault();
        const fullName = document.getElementById('info-name').value.trim();
        const phone = document.getElementById('info-phone').value.trim();
        try {
            const me = await ApiService.users.updateProfile({ fullName, phone });
            store.setUser(me);
            appToast.success('Cập nhật thông tin thành công!');
            await this.reload('info');
        } catch (err) {
            app.showError(err);
        }
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('new-repassword').value;

        if (newPass !== confirmPass) {
            appToast.error('Mật khẩu xác nhận không khớp!');
            return;
        }

        try {
            await ApiService.users.changePassword(current, newPass);
            appToast.success('Đổi mật khẩu thành công!');
            e.target.reset();
        } catch (err) {
            app.showError(err);
        }
    }
};
