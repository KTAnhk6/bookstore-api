/**
 * SHOPPING CART PAGE CONTROLLER
 * Giỏ hàng lưu trên backend; mã giảm giá được backend kiểm tra và tính tiền.
 */

const cartPage = {
    appliedCoupon: null, // { code, calculatedDiscount } — checkout dùng lại mã này
    availableCoupons: [],

    async render(container) {
        if (!store.currentUser) {
            container.innerHTML = `
                <div class="container py-12 text-center">
                    <div style="background: var(--bg-surface); border-radius: var(--radius-xl); padding: 4rem 2rem; border: 1px solid var(--border-color); max-width: 600px; margin: 0 auto;">
                        <i class="fa-solid fa-user-lock text-muted mb-4" style="font-size: 4rem;"></i>
                        <h2 class="text-2xl font-bold mb-2">Đăng nhập để xem giỏ hàng</h2>
                        <p class="text-muted text-sm mb-6">Giỏ hàng được lưu theo tài khoản nên bạn có thể mua tiếp trên mọi thiết bị.</p>
                        <a href="#/auth" class="btn btn-primary btn-lg"><i class="fa-solid fa-arrow-right-to-bracket mr-2"></i> Đăng Nhập</a>
                    </div>
                </div>
            `;
            return;
        }

        const stillHere = app.routeChecker();
        try {
            await store.refreshCart();
            this.availableCoupons = await ApiService.coupons.list().catch(() => []);
            await this.revalidateCoupon();
        } catch (err) {
            app.showError(err);
        }
        if (!stillHere()) return;
        this.draw(container);
    },

    // Tính lại giảm giá theo tạm tính hiện tại; mã không còn hợp lệ thì gỡ
    async revalidateCoupon() {
        if (!this.appliedCoupon) return;
        try {
            const c = await ApiService.coupons.validate(this.appliedCoupon.code, store.cart.subtotal);
            this.appliedCoupon = { code: c.code, calculatedDiscount: c.calculatedDiscount };
        } catch (err) {
            appToast.warning(`Mã ${this.appliedCoupon.code} không còn áp dụng được: ${err.message}`, 'Voucher');
            this.appliedCoupon = null;
        }
    },

    draw(container) {
        const cart = store.cart;
        const items = cart.items;
        const discount = this.appliedCoupon ? this.appliedCoupon.calculatedDiscount : 0;
        const total = Math.max(0, cart.subtotal - discount + cart.shippingFee);

        if (items.length === 0) {
            container.innerHTML = `
                <div class="container py-12 text-center">
                    <div style="background: var(--bg-surface); border-radius: var(--radius-xl); padding: 4rem 2rem; border: 1px solid var(--border-color); max-width: 600px; margin: 0 auto;">
                        <i class="fa-solid fa-cart-shopping text-muted mb-4" style="font-size: 4rem;"></i>
                        <h2 class="text-2xl font-bold mb-2">Giỏ hàng của bạn đang trống</h2>
                        <p class="text-muted text-sm mb-6">Hãy dạo một vòng BookNest và chọn cho mình những cuốn sách ưng ý nhất nhé!</p>
                        <a href="#/catalog" class="btn btn-primary btn-lg">
                            <i class="fa-solid fa-book-open mr-2"></i> Khám Phá Sách Ngay
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        const freeShipGap = Math.max(0, 300000 - cart.subtotal);

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Giỏ Hàng (${cart.count} món)</span>
                </div>

                <h1 class="text-2xl font-bold mb-4">Giỏ Hàng Của Bạn</h1>

                <div class="cart-layout">
                    <!-- Left: Items Table -->
                    <div class="cart-table-wrapper" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 1.5rem;">
                        <table class="cart-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Đơn giá</th>
                                    <th>Số lượng</th>
                                    <th>Tạm tính</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr>
                                        <td>
                                            <div class="cart-product-info">
                                                <img src="${esc(item.coverImage)}" alt="${esc(item.title)}" onerror="this.onerror=null; this.src=app.getBookPlaceholder(this.alt, '');">
                                                <div>
                                                    <a href="#/book/${item.bookId}" class="font-bold text-sm hover-underline d-block mb-1">${esc(item.title)}</a>
                                                    <span class="text-xs text-muted">${esc(item.authorName)}</span>
                                                    ${item.inStock ? '' : '<span class="badge badge-danger d-block mt-1">Hết hàng</span>'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="font-bold text-sm">${store.formatCurrency(item.price)}</span>
                                            ${item.originalPrice ? `<span class="original-price d-block">${store.formatCurrency(item.originalPrice)}</span>` : ''}
                                        </td>
                                        <td>
                                            <div class="quantity-spinner">
                                                <button class="qty-btn" onclick="cartPage.updateQty(${item.itemId}, ${item.quantity - 1})">-</button>
                                                <input type="text" class="qty-input" value="${item.quantity}" readonly>
                                                <button class="qty-btn" onclick="cartPage.updateQty(${item.itemId}, ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="font-bold text-sm text-primary">${store.formatCurrency(item.subtotal)}</span>
                                        </td>
                                        <td class="text-right">
                                            <button class="icon-btn text-danger" title="Xoá món này" onclick="cartPage.removeItem(${item.itemId})">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="d-flex items-center justify-between pt-4 mt-2" style="border-top: 1px solid var(--border-subtle);">
                            <a href="#/catalog" class="btn btn-ghost btn-sm">
                                <i class="fa-solid fa-arrow-left mr-1"></i> Tiếp Tục Mua Sắm
                            </a>
                            <button class="btn btn-outline-danger btn-sm" onclick="modalManager.confirm({
                                title: 'Xoá Giỏ Hàng',
                                message: 'Bạn có chắc chắn muốn xoá toàn bộ sách trong giỏ hàng không?',
                                onConfirm: () => cartPage.clearAll()
                            })">
                                <i class="fa-solid fa-trash mr-1"></i> Xoá Hết
                            </button>
                        </div>
                    </div>

                    <!-- Right: Order Summary & Coupon -->
                    <div class="order-summary-card">
                        <h3 class="font-bold text-lg mb-3">Tóm Tắt Đơn Hàng</h3>

                        <div class="mb-4">
                            <label class="text-xs font-semibold text-muted mb-1 d-block">Mã Khuyến Mãi / Voucher</label>
                            <div class="d-flex gap-2">
                                <input type="text" id="coupon-code-input" class="form-input text-uppercase font-bold"
                                       placeholder="Nhập mã giảm giá" value="${this.appliedCoupon ? esc(this.appliedCoupon.code) : ''}"
                                       onkeydown="if (event.key === 'Enter') cartPage.applyCoupon()">
                                <button class="btn btn-primary btn-sm" onclick="cartPage.applyCoupon()">Áp Dụng</button>
                            </div>
                            ${this.appliedCoupon ? `
                                <div class="badge badge-success mt-2 d-inline-flex items-center gap-1">
                                    <i class="fa-solid fa-check-circle"></i> Đã áp dụng mã: <strong>${esc(this.appliedCoupon.code)}</strong>
                                    <i class="fa-solid fa-xmark ml-2 cursor-pointer" onclick="cartPage.removeCoupon()"></i>
                                </div>
                            ` : this.availableCoupons.length ? `
                                <div class="d-flex flex-wrap gap-1 mt-2">
                                    ${this.availableCoupons.map(c => `
                                        <span class="badge badge-subtle cursor-pointer" title="${esc(c.description || '')}" onclick="cartPage.applyCoupon('${esc(c.code)}')">
                                            ${esc(c.code)} · ${c.discountType === 'PERCENTAGE' ? `-${c.discountValue}%` : `-${store.formatCurrency(c.discountValue)}`} từ ${store.formatCurrency(c.minOrderAmount)}
                                        </span>`).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <div class="summary-row">
                            <span>Tạm tính hàng hoá:</span>
                            <span class="font-semibold text-main">${store.formatCurrency(cart.subtotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Giảm giá voucher:</span>
                            <span class="font-semibold text-success">-${store.formatCurrency(discount)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Phí vận chuyển:</span>
                            <span class="font-semibold ${cart.shippingFee === 0 ? 'text-success' : 'text-main'}">
                                ${cart.shippingFee === 0 ? 'Miễn Phí' : store.formatCurrency(cart.shippingFee)}
                            </span>
                        </div>
                        ${freeShipGap > 0 ? `<div class="text-xs text-muted mb-2">Mua thêm ${store.formatCurrency(freeShipGap)} để được miễn phí vận chuyển (đơn từ 300.000 ₫).</div>` : ''}
                        <div class="summary-row total-row">
                            <span>Tổng thanh toán:</span>
                            <span class="total-amount">${store.formatCurrency(total)}</span>
                        </div>

                        <a href="#/checkout" class="btn btn-primary btn-lg btn-block mt-4">
                            Tiến Hành Thanh Toán <i class="fa-solid fa-arrow-right ml-1"></i>
                        </a>

                        <div class="mt-4 p-3 rounded text-xs text-muted" style="background: var(--bg-subtle);">
                            <i class="fa-solid fa-circle-check text-success mr-1"></i> Hỗ trợ quét mã VietQR ngân hàng 24/7 và thanh toán khi nhận hàng (COD).
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async refresh() {
        await this.revalidateCoupon();
        this.draw(document.getElementById('main-view'));
    },

    async updateQty(itemId, qty) {
        try {
            await store.updateCartQuantity(itemId, qty);
            await this.refresh();
        } catch (err) {
            app.showError(err);
        }
    },

    async removeItem(itemId) {
        try {
            await store.removeFromCart(itemId);
            appToast.info('Đã bỏ cuốn sách khỏi giỏ hàng!');
            await this.refresh();
        } catch (err) {
            app.showError(err);
        }
    },

    async clearAll() {
        try {
            await ApiService.cart.clear();
            await store.refreshCart();
            this.appliedCoupon = null;
            this.draw(document.getElementById('main-view'));
        } catch (err) {
            app.showError(err);
        }
    },

    async applyCoupon(codeArg) {
        const input = document.getElementById('coupon-code-input');
        const code = (codeArg || (input ? input.value : '')).trim().toUpperCase();
        if (!code) return;

        try {
            const c = await ApiService.coupons.validate(code, store.cart.subtotal);
            this.appliedCoupon = { code: c.code, calculatedDiscount: c.calculatedDiscount };
            appToast.success(`Áp dụng thành công mã ${c.code}!`, 'Khuyến Mãi');
            this.draw(document.getElementById('main-view'));
        } catch (err) {
            appToast.error(err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn!', 'Lỗi Voucher');
        }
    },

    removeCoupon() {
        this.appliedCoupon = null;
        appToast.info('Đã gỡ mã giảm giá.');
        this.draw(document.getElementById('main-view'));
    }
};
