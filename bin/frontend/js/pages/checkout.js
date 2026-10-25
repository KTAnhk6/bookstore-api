/**
 * CHECKOUT & VIETQR PAYMENT CONTROLLER
 * Handles address form validation, delivery options, dynamic VietQR generation,
 * bank details copying, and order completion modal.
 */

const checkoutPage = {
    selectedPaymentMethod: 'VIETQR', // 'VIETQR' | 'COD'

    render(container) {
        const cart = store.getCart();
        const user = store.currentUser;
        const subtotal = store.getCartSubtotal();
        const discount = cartPage.appliedCoupon ? (cartPage.appliedCoupon.discount || 0) : 0;
        const shipping = subtotal >= 350000 || (cartPage.appliedCoupon && cartPage.appliedCoupon.code === 'FREESHIP') ? 0 : 25000;
        const total = Math.max(0, subtotal - discount + shipping);

        if (cart.length === 0) {
            app.navigate('#/cart');
            return;
        }

        // Default values from user profile
        const defaultName = user ? user.name : '';
        const defaultPhone = user ? user.phone : '';
        const defaultEmail = user ? user.email : '';
        const defaultAddress = user && user.addresses && user.addresses.length > 0 
            ? user.addresses.find(a => a.isDefault)?.address || user.addresses[0].address
            : '123 Đường Tri Thức, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';

        // Order ID preview
        const tempOrderCode = "BK" + Math.floor(10000 + Math.random() * 90000);
        const vietQrUrl = `https://api.vietqr.io/image/970422-0912345678-qrl81a0.jpg?accountName=BOOKSTORE%20OFFICIAL&amount=${total}&addInfo=${tempOrderCode}`;

        container.innerHTML = `
            <div class="container py-4">
                <div class="breadcrumbs text-sm text-muted mb-4 d-flex items-center gap-2">
                    <a href="#/"><i class="fa-solid fa-house"></i> Trang chủ</a>
                    <span>/</span>
                    <a href="#/cart">Giỏ Hàng</a>
                    <span>/</span>
                    <span class="text-main font-semibold">Thanh Toán Đơn Hàng</span>
                </div>

                <h1 class="text-2xl font-bold mb-6">Thanh Toán & Đặt Hàng</h1>

                <div class="checkout-layout">
                    <!-- Left Column: Form Info & Payment Methods -->
                    <div class="checkout-forms-wrap">
                        <!-- Step 1: Shipping Info -->
                        <div class="checkout-section-card">
                            <h3 class="font-bold text-lg mb-4 d-flex items-center gap-2">
                                <span class="badge badge-primary" style="width: 26px; height: 26px; border-radius: 50%; padding: 0; display: inline-flex; align-items: center; justify-content: center;">1</span>
                                Thông Tin Người Nhận Hàng
                            </h3>

                            <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Họ và tên <span class="required-mark">*</span></label>
                                    <div class="input-with-icon">
                                        <i class="fa-regular fa-user input-icon"></i>
                                        <input type="text" id="checkout-name" class="form-input" placeholder="Nguyễn Văn A" value="${defaultName}">
                                    </div>
                                    <div class="form-feedback d-none" id="err-checkout-name">Vui lòng nhập họ và tên!</div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Số điện thoại <span class="required-mark">*</span></label>
                                    <div class="input-with-icon">
                                        <i class="fa-solid fa-phone input-icon"></i>
                                        <input type="tel" id="checkout-phone" class="form-input" placeholder="0912 345 678" value="${defaultPhone}">
                                    </div>
                                    <div class="form-feedback d-none" id="err-checkout-phone">Vui lòng nhập số điện thoại hợp lệ!</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Email nhận hoá đơn</label>
                                <div class="input-with-icon">
                                    <i class="fa-regular fa-envelope input-icon"></i>
                                    <input type="email" id="checkout-email" class="form-input" placeholder="email@example.com" value="${defaultEmail}">
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Địa chỉ giao hàng chi tiết <span class="required-mark">*</span></label>
                                <div class="input-with-icon">
                                    <i class="fa-solid fa-location-dot input-icon"></i>
                                    <input type="text" id="checkout-address" class="form-input" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP" value="${defaultAddress}">
                                </div>
                                <div class="form-feedback d-none" id="err-checkout-address">Vui lòng nhập địa chỉ giao hàng cụ thể!</div>
                            </div>

                            <div class="form-group mb-0">
                                <label class="form-label">Ghi chú giao hàng (Tuỳ chọn)</label>
                                <textarea id="checkout-note" class="form-textarea" rows="2" placeholder="Ví dụ: Giao hàng vào giờ hành chính, gọi trước khi đến..."></textarea>
                            </div>
                        </div>

                        <!-- Step 2: Payment Method -->
                        <div class="checkout-section-card">
                            <h3 class="font-bold text-lg mb-4 d-flex items-center gap-2">
                                <span class="badge badge-primary" style="width: 26px; height: 26px; border-radius: 50%; padding: 0; display: inline-flex; align-items: center; justify-content: center;">2</span>
                                Chọn Phương Thức Thanh Toán
                            </h3>

                            <!-- Method: VietQR -->
                            <div class="payment-method-card ${this.selectedPaymentMethod === 'VIETQR' ? 'selected' : ''}" 
                                 onclick="checkoutPage.selectPaymentMethod('VIETQR')">
                                <input type="radio" name="payment_method" value="VIETQR" ${this.selectedPaymentMethod === 'VIETQR' ? 'checked' : ''} style="margin-top: 4px;">
                                <div class="flex-1">
                                    <div class="d-flex items-center justify-between">
                                        <div class="font-bold text-sm d-flex items-center gap-2">
                                            <i class="fa-solid fa-qrcode text-primary text-lg"></i>
                                            <span>Chuyển Khoản Ngân Hàng Qua Mã VietQR (Khuyên dùng)</span>
                                        </div>
                                        <span class="badge badge-success">Xử Lý Tức Thì 24/7</span>
                                    </div>
                                    <p class="text-xs text-muted mt-1">
                                        Mở app mọi ngân hàng (Vietcombank, MB, Techcombank, VPBank...) để quét mã thanh toán không cần nhập số tài khoản.
                                    </p>
                                </div>
                            </div>

                            <!-- VietQR Details Box Display -->
                            <div class="vietqr-box ${this.selectedPaymentMethod === 'VIETQR' ? '' : 'd-none'}" id="vietqr-live-box">
                                <div class="vietqr-image-wrap">
                                    <img src="${vietQrUrl}" alt="VietQR Payment">
                                    <div class="text-xs font-bold text-primary mt-2">
                                        <i class="fa-solid fa-arrows-rotate animate-spin mr-1"></i> Quét mã để thanh toán tự động
                                    </div>
                                </div>

                                <div class="vietqr-bank-details">
                                    <div class="copy-detail-row">
                                        <span class="text-muted">Ngân hàng thụ hưởng:</span>
                                        <strong>MBBank (Ngân hàng Quân Đội)</strong>
                                    </div>
                                    <div class="copy-detail-row">
                                        <span class="text-muted">Số tài khoản:</span>
                                        <div class="d-flex items-center gap-2">
                                            <strong class="text-primary font-bold">0912345678</strong>
                                            <button class="btn btn-xs btn-ghost text-primary" onclick="navigator.clipboard.writeText('0912345678'); appToast.success('Đã sao chép số tài khoản!');">
                                                <i class="fa-regular fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="copy-detail-row">
                                        <span class="text-muted">Tên chủ tài khoản:</span>
                                        <strong>BOOKSTORE OFFICIAL</strong>
                                    </div>
                                    <div class="copy-detail-row">
                                        <span class="text-muted">Số tiền chuyển:</span>
                                        <strong class="text-danger font-bold">${store.formatCurrency(total)}</strong>
                                    </div>
                                    <div class="copy-detail-row">
                                        <span class="text-muted">Nội dung chuyển khoản:</span>
                                        <div class="d-flex items-center gap-2">
                                            <strong class="text-primary font-bold">${tempOrderCode}</strong>
                                            <button class="btn btn-xs btn-ghost text-primary" onclick="navigator.clipboard.writeText('${tempOrderCode}'); appToast.success('Đã sao chép nội dung!');">
                                                <i class="fa-regular fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Method: COD -->
                            <div class="payment-method-card mt-3 ${this.selectedPaymentMethod === 'COD' ? 'selected' : ''}" 
                                 onclick="checkoutPage.selectPaymentMethod('COD')">
                                <input type="radio" name="payment_method" value="COD" ${this.selectedPaymentMethod === 'COD' ? 'checked' : ''} style="margin-top: 4px;">
                                <div class="flex-1">
                                    <div class="font-bold text-sm d-flex items-center gap-2">
                                        <i class="fa-solid fa-truck text-muted text-lg"></i>
                                        <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
                                    </div>
                                    <p class="text-xs text-muted mt-1">
                                        Nhận sách tại nhà, kiểm tra hàng và thanh toán trực tiếp cho shipper.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Order Items Summary -->
                    <div class="checkout-summary-wrap">
                        <div class="order-summary-card">
                            <h3 class="font-bold text-lg mb-3">Đơn Hàng (${cart.length} sản phẩm)</h3>
                            
                            <div class="order-items-scroll-list mb-4" style="max-height: 260px; overflow-y: auto; padding-right: 4px;">
                                ${cart.map(item => `
                                    <div class="d-flex items-center gap-3 py-2" style="border-bottom: 1px solid var(--border-subtle);">
                                        <img src="${item.coverImage}" alt="${item.title}" style="width: 44px; height: 58px; object-fit: cover; border-radius: var(--radius-sm);">
                                        <div class="flex-1 text-xs">
                                            <div class="font-bold text-truncate" style="max-width: 190px;">${item.title}</div>
                                            <div class="text-muted">SL: ${item.quantity} x ${store.formatCurrency(item.price)}</div>
                                        </div>
                                        <div class="font-bold text-xs text-right">
                                            ${store.formatCurrency(item.price * item.quantity)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="summary-row">
                                <span>Tạm tính:</span>
                                <span class="font-semibold">${store.formatCurrency(subtotal)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Giảm giá voucher:</span>
                                <span class="font-semibold text-success">-${store.formatCurrency(discount)}</span>
                            </div>
                            <div class="summary-row">
                                <span>Phí vận chuyển:</span>
                                <span class="font-semibold ${shipping === 0 ? 'text-success' : ''}">${shipping === 0 ? 'Miễn Phí' : store.formatCurrency(shipping)}</span>
                            </div>
                            <div class="summary-row total-row">
                                <span>Tổng thanh toán:</span>
                                <span class="total-amount" id="checkout-total-amount">${store.formatCurrency(total)}</span>
                            </div>

                            <button class="btn btn-primary btn-lg btn-block mt-4" id="btn-submit-order" onclick="checkoutPage.processOrder('${tempOrderCode}', ${total}, ${subtotal}, ${discount}, ${shipping})">
                                <i class="fa-solid fa-lock mr-1"></i> Xác Nhận Đặt Hàng
                            </button>

                            <p class="text-xs text-muted text-center mt-3">
                                Bằng việc bấm đặt hàng, bạn đồng ý với Điều khoản dịch vụ của BookNest.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;
        const liveBox = document.getElementById('vietqr-live-box');
        
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));
        if (method === 'VIETQR') {
            document.querySelectorAll('.payment-method-card')[0].classList.add('selected');
            if (liveBox) liveBox.classList.remove('d-none');
        } else {
            document.querySelectorAll('.payment-method-card')[1].classList.add('selected');
            if (liveBox) liveBox.classList.add('d-none');
        }
    },

    async processOrder(tempCode, total, subtotal, discount, shipping) {
        const nameInput = document.getElementById('checkout-name');
        const phoneInput = document.getElementById('checkout-phone');
        const addressInput = document.getElementById('checkout-address');
        const noteInput = document.getElementById('checkout-note');

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const address = addressInput.value.trim();
        const note = noteInput ? noteInput.value.trim() : '';

        // Validation checks
        let hasError = false;

        if (!name) {
            document.getElementById('err-checkout-name').classList.remove('d-none');
            nameInput.classList.add('is-invalid');
            hasError = true;
        } else {
            document.getElementById('err-checkout-name').classList.add('d-none');
            nameInput.classList.remove('is-invalid');
        }

        if (!phone || phone.length < 9) {
            document.getElementById('err-checkout-phone').classList.remove('d-none');
            phoneInput.classList.add('is-invalid');
            hasError = true;
        } else {
            document.getElementById('err-checkout-phone').classList.add('d-none');
            phoneInput.classList.remove('is-invalid');
        }

        if (!address) {
            document.getElementById('err-checkout-address').classList.remove('d-none');
            addressInput.classList.add('is-invalid');
            hasError = true;
        } else {
            document.getElementById('err-checkout-address').classList.add('d-none');
            addressInput.classList.remove('is-invalid');
        }

        if (hasError) {
            appToast.error('Vui lòng điền đầy đủ và chính xác thông tin nhận hàng!', 'Thiếu Thông Tin');
            return;
        }

        const btn = document.getElementById('btn-submit-order');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang xử lý đơn hàng...';

        try {
            const orderPayload = {
                customerName: name,
                customerPhone: phone,
                deliveryAddress: address,
                orderNote: note,
                items: store.getCart(),
                subtotal: subtotal,
                couponDiscount: discount,
                shippingFee: shipping,
                totalAmount: total,
                paymentMethod: this.selectedPaymentMethod
            };

            const createdOrder = await ApiService.orders.create(orderPayload);

            // Render Success Screen
            this.renderSuccess(createdOrder);
        } catch (err) {
            appToast.error(err.message || 'Không thể tạo đơn hàng.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> Xác Nhận Đặt Hàng';
        }
    },

    renderSuccess(order) {
        const container = document.getElementById('main-view');
        container.innerHTML = `
            <div class="container py-12">
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 3.5rem 2rem; max-width: 680px; margin: 0 auto; text-align: center; box-shadow: var(--shadow-xl);">
                    <div style="width: 72px; height: 72px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 2.25rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                        <i class="fa-solid fa-check"></i>
                    </div>

                    <h1 class="text-2xl font-bold mb-2">Đặt Hàng Thành Công!</h1>
                    <p class="text-muted text-sm mb-6">Mã đơn hàng: <strong class="text-primary font-bold">${order.id}</strong>. Cảm ơn bạn đã tin tưởng lựa chọn BookNest!</p>

                    ${order.paymentMethod === 'VIETQR' ? `
                        <div class="p-4 rounded-lg mb-6 text-left" style="background: var(--bg-subtle); border: 1px solid var(--border-color);">
                            <div class="d-flex items-center justify-between mb-2">
                                <span class="font-bold text-sm text-primary"><i class="fa-solid fa-qrcode mr-1"></i> Thanh Toán VietQR</span>
                                <span class="badge badge-success">Đã Khởi Tạo</span>
                            </div>
                            <p class="text-xs text-muted mb-3">Hệ thống tự động kích hoạt giao hàng siêu tốc 2h ngay khi giao dịch hoàn tất.</p>
                            <div class="text-center">
                                <img src="${order.qrCodeUrl}" alt="VietQR" style="width: 180px; height: 180px; border-radius: var(--radius-md); margin: 0 auto;">
                            </div>
                        </div>
                    ` : ''}

                    <div class="p-4 rounded-lg mb-6 text-left text-sm" style="background: var(--bg-subtle);">
                        <div class="d-flex justify-between py-1"><span>Người nhận:</span> <strong>${order.customerName} (${order.customerPhone})</strong></div>
                        <div class="d-flex justify-between py-1"><span>Địa chỉ:</span> <strong class="text-truncate" style="max-width: 320px;">${order.deliveryAddress}</strong></div>
                        <div class="d-flex justify-between py-1"><span>Tổng thanh toán:</span> <strong class="text-primary font-bold text-base">${store.formatCurrency(order.totalAmount)}</strong></div>
                    </div>

                    <div class="d-flex items-center justify-center gap-3">
                        <a href="#/profile?tab=orders" class="btn btn-primary">
                            <i class="fa-solid fa-box-open mr-1"></i> Xem Đơn Hàng Của Tôi
                        </a>
                        <a href="#/" class="btn btn-ghost">
                            Về Trang Chủ
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
};
