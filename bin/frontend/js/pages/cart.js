/**
 * SHOPPING CART PAGE CONTROLLER
 * Item table, quantity adjustment, coupon voucher calculation,
 * and order subtotal summary.
 */

const cartPage = {
    appliedCoupon: null,

    render(container) {
        const cart = store.getCart();
        const subtotal = store.getCartSubtotal();
        let discount = 0;

        if (this.appliedCoupon) {
            if (this.appliedCoupon.code === 'BOOK20' && subtotal >= 200000) discount = 20000;
            else if (this.appliedCoupon.code === 'VIP50' && subtotal >= 400000) discount = 50000;
            else if (this.appliedCoupon.code === 'FREESHIP') discount = 30000;
        }

        const shipping = subtotal >= 350000 || (this.appliedCoupon && this.appliedCoupon.code === 'FREESHIP') ? 0 : (cart.length ? 25000 : 0);
        const total = Math.max(0, subtotal - discount + shipping);

        if (cart.length === 0) {
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

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Giỏ Hàng (${store.getCartCount()} món)</span>
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
                                ${cart.map(item => `
                                    <tr>
                                        <td>
                                            <div class="cart-product-info">
                                                <img src="${item.coverImage}" alt="${item.title}">
                                                <div>
                                                    <a href="#/book/${item.bookId}" class="font-bold text-sm hover-underline d-block mb-1">${item.title}</a>
                                                    <span class="text-xs text-muted">${item.authorName || ''}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="font-bold text-sm">${store.formatCurrency(item.price)}</span>
                                        </td>
                                        <td>
                                            <div class="quantity-spinner">
                                                <button class="qty-btn" onclick="cartPage.updateQty('${item.bookId}', ${item.quantity - 1})">-</button>
                                                <input type="text" class="qty-input" value="${item.quantity}" readonly>
                                                <button class="qty-btn" onclick="cartPage.updateQty('${item.bookId}', ${item.quantity + 1})">+</button>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="font-bold text-sm text-primary">${store.formatCurrency(item.price * item.quantity)}</span>
                                        </td>
                                        <td class="text-right">
                                            <button class="icon-btn text-danger" title="Xoá món này" onclick="cartPage.removeItem('${item.bookId}')">
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
                                onConfirm: () => { store.clearCart(); cartPage.render(container); }
                            })">
                                <i class="fa-solid fa-trash mr-1"></i> Xoá Hết
                            </button>
                        </div>
                    </div>

                    <!-- Right: Order Summary & Coupon -->
                    <div class="order-summary-card">
                        <h3 class="font-bold text-lg mb-3">Tóm Tắt Đơn Hàng</h3>
                        
                        <!-- Coupon Form -->
                        <div class="mb-4">
                            <label class="text-xs font-semibold text-muted mb-1 d-block">Mã Khuyến Mãi / Voucher</label>
                            <div class="d-flex gap-2">
                                <input type="text" id="coupon-code-input" class="form-input text-uppercase font-bold" 
                                       placeholder="VD: BOOK20, FREESHIP" value="${this.appliedCoupon ? this.appliedCoupon.code : ''}">
                                <button class="btn btn-primary btn-sm" onclick="cartPage.applyCoupon()">Áp Dụng</button>
                            </div>
                            ${this.appliedCoupon ? `
                                <div class="badge badge-success mt-2 d-inline-flex items-center gap-1">
                                    <i class="fa-solid fa-check-circle"></i> Đã áp dụng mã: <strong>${this.appliedCoupon.code}</strong>
                                    <i class="fa-solid fa-xmark ml-2 cursor-pointer" onclick="cartPage.removeCoupon()"></i>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Summary Rows -->
                        <div class="summary-row">
                            <span>Tạm tính hàng hoá:</span>
                            <span class="font-semibold text-main">${store.formatCurrency(subtotal)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Giảm giá voucher:</span>
                            <span class="font-semibold text-success">-${store.formatCurrency(discount)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Phí vận chuyển:</span>
                            <span class="font-semibold ${shipping === 0 ? 'text-success' : 'text-main'}">
                                ${shipping === 0 ? 'Miễn Phí' : store.formatCurrency(shipping)}
                            </span>
                        </div>
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

    updateQty(bookId, qty) {
        store.updateCartQuantity(bookId, qty);
        this.render(document.getElementById('main-view'));
    },

    removeItem(bookId) {
        store.removeFromCart(bookId);
        appToast.info('Đã bỏ cuốn sách khỏi giỏ hàng!');
        this.render(document.getElementById('main-view'));
    },

    applyCoupon() {
        const input = document.getElementById('coupon-code-input');
        const code = input ? input.value.trim().toUpperCase() : '';
        const found = BOOKNEST_DATA.coupons.find(c => c.code === code);

        if (found) {
            const subtotal = store.getCartSubtotal();
            if (subtotal < found.minSpend) {
                appToast.warning(`Mã ${found.code} yêu cầu đơn hàng tối thiểu từ ${store.formatCurrency(found.minSpend)}!`, 'Chưa Đủ Điều Kiện');
                return;
            }
            this.appliedCoupon = found;
            appToast.success(`Áp dụng thành công mã giảm ${found.code}!`, 'Khuyến Mãi');
            this.render(document.getElementById('main-view'));
        } else {
            appToast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn!', 'Lỗi Voucher');
        }
    },

    removeCoupon() {
        this.appliedCoupon = null;
        appToast.info('Đã gỡ mã giảm giá.');
        this.render(document.getElementById('main-view'));
    }
};
