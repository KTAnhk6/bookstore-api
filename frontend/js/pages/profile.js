/**
 * USER PROFILE & ACCOUNT HUB CONTROLLER (Trang cá nhân)
 * Order tracking, Address Book, Reviews history, and 5 Favorite Genres management.
 */

const profilePage = {
    activeTab: 'orders',

    render(container, queryParams = {}) {
        const user = store.currentUser;
        if (!user) {
            app.navigate('#/auth');
            return;
        }

        this.activeTab = queryParams.tab || 'orders';
        const orders = store.getMyOrders();
        const favoriteCategoryIds = store.getFavoriteCategories();
        const allCategories = store.getCategories();
        const favoriteCategories = allCategories.filter(c => favoriteCategoryIds.includes(c.id));

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
                            <div class="profile-avatar-large">${user.name.charAt(0)}</div>
                            <h3 class="font-bold text-base mb-1">${user.name}</h3>
                            <p class="text-xs text-muted mb-2">${user.email}</p>
                            <span class="badge ${user.role === 'ROLE_ADMIN' ? 'badge-primary' : 'badge-subtle'}">
                                ${user.role === 'ROLE_ADMIN' ? 'Quản Trị Viên' : 'Khách Hàng Thân Thiết'}
                            </span>
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
                            <div class="profile-nav-item danger-item text-danger mt-3" onclick="store.logout(); app.navigate('#/auth');">
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
                                    <p class="text-xs text-muted mt-1">Hệ thống AI BookNest dựa vào các sở thích này để gợi ý những cuốn sách phù hợp nhất cho bạn.</p>
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="favoriteGenresModal.open()">
                                    <i class="fa-solid fa-pen-to-square mr-1"></i> Chỉnh Sửa 5 Thể Loại
                                </button>
                            </div>

                            <div class="d-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
                                ${favoriteCategories.map(cat => `
                                    <div class="p-4 text-center rounded-lg" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                        <div class="text-2xl text-primary mb-2"><i class="${cat.icon || 'fa-solid fa-book'}"></i></div>
                                        <div class="font-bold text-sm mb-1">${cat.name}</div>
                                        <a href="#/catalog?category=${cat.id}" class="text-xs text-primary font-semibold hover-underline">Xem sách thuộc thể loại →</a>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="mt-6 p-4 rounded-lg d-flex items-center justify-between" style="background: var(--primary-light); color: var(--primary);">
                                <div class="d-flex items-center gap-3">
                                    <i class="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                                    <div>
                                        <div class="font-bold text-sm">Xem ngay danh sách đề xuất dành riêng cho bạn!</div>
                                        <div class="text-xs">Được cá nhân hóa liên tục theo hành vi đọc sách của bạn.</div>
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

                            ${(user.addresses || []).map(addr => `
                                <div class="p-4 rounded-lg mb-3 d-flex items-start justify-between" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                                    <div>
                                        <div class="d-flex items-center gap-2 mb-1">
                                            <strong class="font-bold text-sm">${addr.fullName}</strong>
                                            <span class="text-xs text-muted">| ${addr.phone}</span>
                                            ${addr.isDefault ? `<span class="badge badge-success">Mặc Định</span>` : ''}
                                        </div>
                                        <p class="text-sm text-muted">${addr.address}</p>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-xs btn-ghost text-primary" onclick="profilePage.openAddressModal('${addr.id || addr.fullName}')"><i class="fa-solid fa-pen"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Tab 4: Info Form -->
                        <div id="p-tab-info" class="${this.activeTab === 'info' ? '' : 'd-none'}">
                            <h2 class="text-xl font-bold mb-4 pb-3" style="border-bottom: 1px solid var(--border-color);">Cập Nhật Thông Tin Cá Nhân</h2>
                            <form onsubmit="event.preventDefault(); appToast.success('Cập nhật thông tin thành công!');">
                                <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label">Họ và tên</label>
                                        <input type="text" class="form-input" value="${user.name}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Email tài khoản</label>
                                        <input type="email" class="form-input" value="${user.email}" readonly disabled>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Số điện thoại</label>
                                    <input type="tel" class="form-input" value="${user.phone || '0912 345 678'}">
                                </div>
                                <button type="submit" class="btn btn-primary mt-2">
                                    <i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Thay Đổi
                                </button>
                            </form>
                        </div>
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
                            <div class="form-group">
                                <label class="form-label">Địa chỉ chi tiết <span class="required-mark">*</span></label>
                                <textarea id="addr-detail" class="form-input" rows="3" required placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."></textarea>
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
        `;
    },

    renderOrderCard(order) {
        const statusBadges = {
            PROCESSING: '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Đang Xử Lý</span>',
            SHIPPING: '<span class="badge badge-info"><i class="fa-solid fa-truck-fast"></i> Đang Giao Hàng</span>',
            COMPLETED: '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Đã Giao Thành Công</span>',
            CANCELLED: '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Đã Huỷ</span>'
        };

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <span class="font-bold text-sm text-primary">#${order.id}</span>
                        <span class="text-xs text-muted ml-2">${store.formatDate(order.orderDate)}</span>
                    </div>
                    <div>
                        ${statusBadges[order.orderStatus] || '<span class="badge badge-subtle">Chờ Xử Lý</span>'}
                    </div>
                </div>

                <div class="order-book-preview-list">
                    ${(order.items || []).map(item => `
                        <div class="order-book-item">
                            <div class="d-flex items-center gap-2">
                                <img src="${item.coverImage}" alt="${item.title}" style="width: 36px; height: 48px; object-fit: cover; border-radius: var(--radius-sm);">
                                <div>
                                    <div class="font-bold text-xs text-truncate" style="max-width: 280px;">${item.title}</div>
                                    <span class="text-xs text-muted">${item.quantity} cuốn x ${store.formatCurrency(item.price)}</span>
                                </div>
                            </div>
                            <span class="font-bold text-xs">${store.formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="d-flex items-center justify-between pt-3 mt-3" style="border-top: 1px solid var(--border-subtle);">
                    <div class="text-xs text-muted">
                        PTTT: <strong>${order.paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Tiền mặt (COD)'}</strong>
                    </div>
                    <div class="d-flex items-center gap-3">
                        <div>Tổng tiền: <strong class="text-primary font-bold text-sm">${store.formatCurrency(order.totalAmount)}</strong></div>
                        ${order.orderStatus === 'PROCESSING' ? `
                            <button class="btn btn-xs btn-outline-danger" onclick="modalManager.confirm({
                                title: 'Huỷ Đơn Hàng',
                                message: 'Bạn có chắc chắn muốn huỷ đơn hàng #${order.id}?',
                                onConfirm: () => { store.updateOrderStatus('${order.id}', 'CANCELLED'); appToast.info('Đã huỷ đơn hàng thành công.'); profilePage.render(document.getElementById('main-view')); }
                            })">Huỷ Đơn</button>
                        ` : ''}
                        <button class="btn btn-xs btn-outline-primary" onclick="
                            order.items.forEach(i => store.addToCart(store.getBooks().find(b => b.id === i.bookId) || i, i.quantity));
                            appToast.success('Đã thêm các món vào giỏ!');
                            app.navigate('#/cart');
                        ">Mua Lại</button>
                    </div>
                </div>
            </div>
        `;
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render(document.getElementById('main-view'), { tab });
    },

    openAddressModal(addrId = null) {
        const titleEl = document.getElementById('address-modal-title');
        const idInput = document.getElementById('addr-id');
        const nameInput = document.getElementById('addr-name');
        const phoneInput = document.getElementById('addr-phone');
        const detailInput = document.getElementById('addr-detail');
        const defaultInput = document.getElementById('addr-default');

        if (addrId) {
            titleEl.textContent = 'Chỉnh Sửa Địa Chỉ';
            const user = store.currentUser;
            const addr = (user.addresses || []).find(a => a.id == addrId || a.fullName === addrId);
            if (addr) {
                idInput.value = addr.id || addr.fullName;
                nameInput.value = addr.fullName;
                phoneInput.value = addr.phone;
                detailInput.value = addr.address;
                defaultInput.checked = addr.isDefault;
            }
        } else {
            titleEl.textContent = 'Thêm Địa Chỉ Mới';
            idInput.value = '';
            nameInput.value = '';
            phoneInput.value = '';
            detailInput.value = '';
            defaultInput.checked = false;
        }
        
        modalManager.open('address-modal');
    },

    handleSaveAddress(e) {
        e.preventDefault();
        appToast.success('Đã lưu thông tin địa chỉ thành công!');
        modalManager.close('address-modal');
        // In a real app, you would call API and then re-render
    },

    handleChangePassword(e) {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('new-repassword').value;

        if (newPass !== confirmPass) {
            appToast.error('Mật khẩu xác nhận không khớp!');
            return;
        }

        appToast.success('Đổi mật khẩu thành công!');
        e.target.reset();
    }
};
