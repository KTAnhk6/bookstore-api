/**
 * CHECKOUT & VIETQR PAYMENT CONTROLLER
 * Đặt hàng thật qua backend: địa chỉ đã lưu / nhập mới, COD hoặc VietQR (phiên 10 phút,
 * server tự đối soát sao kê ngân hàng).
 */

const checkoutPage = {
    selectedPaymentMethod: 'QR_CODE', // 'QR_CODE' | 'COD'
    addresses: [],
    selectedAddressId: null, // null = nhập địa chỉ mới
    session: null,
    sessionOrder: null,
    timer: null,
    polling: false,

    async render(container) {
        if (!app.requireLogin('Vui lòng đăng nhập để thanh toán!')) return;
        this.stopTimer();

        const stillHere = app.routeChecker();
        try {
            await store.refreshCart();
            this.addresses = await ApiService.addresses.list();
            // Giỏ đã chuyển thành đơn của phiên QR đang chờ -> mở lại phiên đó
            const active = store.cart.items.length === 0 ? await ApiService.qr.active() : null;
            if (!stillHere()) return;
            if (active) {
                await this.showSession(active);
                return;
            }
        } catch (err) {
            if (stillHere()) app.showError(err);
            return;
        }

        if (store.cart.items.length === 0) {
            app.navigate('#/cart');
            return;
        }

        const def = this.addresses.find(a => a.isDefault) || this.addresses[0];
        this.selectedAddressId = def ? def.id : null;
        this.draw(container);
    },

    couponCode() {
        return typeof cartPage !== 'undefined' && cartPage.appliedCoupon ? cartPage.appliedCoupon.code : null;
    },

    draw(container) {
        const cart = store.cart;
        const user = store.currentUser;
        const discount = typeof cartPage !== 'undefined' && cartPage.appliedCoupon ? cartPage.appliedCoupon.calculatedDiscount : 0;
        const total = Math.max(0, cart.subtotal - discount + cart.shippingFee);

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
                    <div class="checkout-forms-wrap">
                        <!-- Bước 1: Địa chỉ -->
                        <div class="checkout-section-card">
                            <h3 class="font-bold text-lg mb-4 d-flex items-center gap-2">
                                <span class="badge badge-primary" style="width: 26px; height: 26px; border-radius: 50%; padding: 0; display: inline-flex; align-items: center; justify-content: center;">1</span>
                                Thông Tin Người Nhận Hàng
                            </h3>

                            ${this.addresses.map(a => `
                                <label class="payment-method-card mb-2 ${this.selectedAddressId === a.id ? 'selected' : ''}" style="cursor: pointer;">
                                    <input type="radio" name="address_choice" value="${a.id}" ${this.selectedAddressId === a.id ? 'checked' : ''}
                                           onchange="checkoutPage.selectAddress('${a.id}')" style="margin-top: 4px;">
                                    <div class="flex-1 text-sm">
                                        <div class="font-bold">${esc(a.recipientName)} · ${esc(a.phone)}
                                            ${a.isDefault ? '<span class="badge badge-success ml-1">Mặc định</span>' : ''}</div>
                                        <div class="text-muted text-xs mt-1">${esc([a.detailAddress, a.ward, a.district, a.province].filter(Boolean).join(', '))}</div>
                                    </div>
                                </label>
                            `).join('')}
                            <label class="payment-method-card mb-3 ${this.selectedAddressId === null ? 'selected' : ''}" style="cursor: pointer;">
                                <input type="radio" name="address_choice" value="" ${this.selectedAddressId === null ? 'checked' : ''}
                                       onchange="checkoutPage.selectAddress(null)" style="margin-top: 4px;">
                                <div class="flex-1 text-sm font-bold"><i class="fa-solid fa-plus mr-1 text-primary"></i> Giao đến địa chỉ khác</div>
                            </label>

                            <div id="new-address-form" class="${this.selectedAddressId === null ? '' : 'd-none'}">
                                <div class="d-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label">Họ và tên <span class="required-mark">*</span></label>
                                        <input type="text" id="checkout-name" class="form-input" placeholder="Nguyễn Văn A" value="${esc(user.name)}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Số điện thoại <span class="required-mark">*</span></label>
                                        <input type="tel" id="checkout-phone" class="form-input" placeholder="0912 345 678" value="${esc(user.phone || '')}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Tỉnh / Thành phố <span class="required-mark">*</span></label>
                                        <input type="text" id="checkout-province" class="form-input" placeholder="TP. Hồ Chí Minh">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Quận / Huyện <span class="required-mark">*</span></label>
                                        <input type="text" id="checkout-district" class="form-input" placeholder="Quận 1">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Phường / Xã</label>
                                    <input type="text" id="checkout-ward" class="form-input" placeholder="Phường Bến Nghé">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Số nhà, tên đường <span class="required-mark">*</span></label>
                                    <input type="text" id="checkout-detail" class="form-input" placeholder="123 Đường Tri Thức">
                                </div>
                            </div>

                            <div class="form-group mb-0 mt-3">
                                <label class="form-label">Ghi chú giao hàng (Tuỳ chọn)</label>
                                <textarea id="checkout-note" class="form-textarea" rows="2" placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi đến..."></textarea>
                            </div>
                        </div>

                        <!-- Bước 2: Thanh toán -->
                        <div class="checkout-section-card">
                            <h3 class="font-bold text-lg mb-4 d-flex items-center gap-2">
                                <span class="badge badge-primary" style="width: 26px; height: 26px; border-radius: 50%; padding: 0; display: inline-flex; align-items: center; justify-content: center;">2</span>
                                Chọn Phương Thức Thanh Toán
                            </h3>

                            <div class="payment-method-card ${this.selectedPaymentMethod === 'QR_CODE' ? 'selected' : ''}" onclick="checkoutPage.selectPaymentMethod('QR_CODE')">
                                <input type="radio" name="payment_method" value="QR_CODE" ${this.selectedPaymentMethod === 'QR_CODE' ? 'checked' : ''} style="margin-top: 4px;">
                                <div class="flex-1">
                                    <div class="d-flex items-center justify-between">
                                        <div class="font-bold text-sm d-flex items-center gap-2">
                                            <i class="fa-solid fa-qrcode text-primary text-lg"></i>
                                            <span>Chuyển khoản qua mã VietQR (Khuyên dùng)</span>
                                        </div>
                                        <span class="badge badge-success">Xác nhận tự động 24/7</span>
                                    </div>
                                    <p class="text-xs text-muted mt-1">Bấm đặt hàng để nhận mã QR dành riêng cho đơn này, hiệu lực 10 phút. Hệ thống tự xác nhận khi tiền về tài khoản.</p>
                                </div>
                            </div>

                            <div class="payment-method-card mt-3 ${this.selectedPaymentMethod === 'COD' ? 'selected' : ''}" onclick="checkoutPage.selectPaymentMethod('COD')">
                                <input type="radio" name="payment_method" value="COD" ${this.selectedPaymentMethod === 'COD' ? 'checked' : ''} style="margin-top: 4px;">
                                <div class="flex-1">
                                    <div class="font-bold text-sm d-flex items-center gap-2">
                                        <i class="fa-solid fa-truck text-muted text-lg"></i>
                                        <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
                                    </div>
                                    <p class="text-xs text-muted mt-1">Nhận sách tại nhà, kiểm tra hàng và thanh toán trực tiếp cho shipper.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tóm tắt đơn -->
                    <div class="checkout-summary-wrap">
                        <div class="order-summary-card">
                            <h3 class="font-bold text-lg mb-3">Đơn Hàng (${cart.count} sản phẩm)</h3>
                            <div class="order-items-scroll-list mb-4" style="max-height: 260px; overflow-y: auto; padding-right: 4px;">
                                ${cart.items.map(item => `
                                    <div class="d-flex items-center gap-3 py-2" style="border-bottom: 1px solid var(--border-subtle);">
                                        <img src="${esc(item.coverImage)}" alt="${esc(item.title)}" style="width: 44px; height: 58px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.onerror=null; this.src=app.getBookPlaceholder(this.alt, '');">
                                        <div class="flex-1 text-xs">
                                            <div class="font-bold text-truncate" style="max-width: 190px;">${esc(item.title)}</div>
                                            <div class="text-muted">SL: ${item.quantity} x ${store.formatCurrency(item.price)}</div>
                                        </div>
                                        <div class="font-bold text-xs text-right">${store.formatCurrency(item.subtotal)}</div>
                                    </div>
                                `).join('')}
                            </div>

                            ${this.breakdownHtml(cart.subtotal, discount, cart.shippingFee, total, this.couponCode())}

                            <button class="btn btn-primary btn-lg btn-block mt-4" id="btn-submit-order" onclick="checkoutPage.processOrder()">
                                <i class="fa-solid fa-lock mr-1"></i> Xác Nhận Đặt Hàng
                            </button>
                            <p class="text-xs text-muted text-center mt-3">Bằng việc bấm đặt hàng, bạn đồng ý với Điều khoản dịch vụ của BookNest.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    breakdownHtml(subtotal, discount, shipping, total, couponCode) {
        return `
            <div class="summary-row"><span>Tạm tính:</span><span class="font-semibold">${store.formatCurrency(subtotal)}</span></div>
            <div class="summary-row"><span>Giảm giá${couponCode ? ` (${esc(couponCode)})` : ''}:</span><span class="font-semibold text-success">-${store.formatCurrency(discount)}</span></div>
            <div class="summary-row">
                <span>Phí vận chuyển:</span>
                <span class="font-semibold ${shipping === 0 ? 'text-success' : ''}">${shipping === 0 ? 'Miễn Phí' : store.formatCurrency(shipping)}</span>
            </div>
            ${shipping > 0 ? '<div class="text-xs text-muted mb-2">Đơn dưới 300.000 ₫ thu phí vận chuyển 30.000 ₫.</div>' : ''}
            <div class="summary-row total-row"><span>Tổng thanh toán:</span><span class="total-amount">${store.formatCurrency(total)}</span></div>
        `;
    },

    selectAddress(id) {
        this.selectedAddressId = id;
        document.getElementById('new-address-form').classList.toggle('d-none', id !== null);
        document.querySelectorAll('input[name="address_choice"]').forEach(r => {
            r.closest('.payment-method-card').classList.toggle('selected', r.checked);
        });
    },

    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;
        document.querySelectorAll('input[name="payment_method"]').forEach(r => {
            r.checked = r.value === method;
            r.closest('.payment-method-card').classList.toggle('selected', r.checked);
        });
    },

    // Gom địa chỉ + ghi chú + mã giảm giá thành body gửi backend; trả null nếu form thiếu
    buildRequest() {
        const val = (id) => (document.getElementById(id)?.value || '').trim();
        const body = { note: val('checkout-note') || undefined, couponCode: this.couponCode() || undefined };

        if (this.selectedAddressId !== null) {
            body.addressId = Number(this.selectedAddressId);
            return body;
        }

        const fields = {
            recipientName: val('checkout-name'), phone: val('checkout-phone'),
            province: val('checkout-province'), district: val('checkout-district'),
            ward: val('checkout-ward'), detailAddress: val('checkout-detail')
        };
        if (!fields.recipientName || fields.phone.length < 9 || !fields.province || !fields.district || !fields.detailAddress) {
            appToast.error('Vui lòng điền họ tên, số điện thoại, tỉnh, quận và địa chỉ cụ thể!', 'Thiếu Thông Tin');
            return null;
        }
        return { ...body, ...fields };
    },

    async processOrder() {
        const body = this.buildRequest();
        if (!body) return;

        const btn = document.getElementById('btn-submit-order');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang xử lý đơn hàng...';

        try {
            if (this.selectedPaymentMethod === 'QR_CODE') {
                const session = await ApiService.qr.createSession(body);
                await store.refreshCart();
                if (typeof cartPage !== 'undefined') cartPage.appliedCoupon = null;
                await this.showSession(session);
            } else {
                const order = await ApiService.orders.create({ ...body, paymentMethod: 'COD' });
                await store.refreshCart();
                if (typeof cartPage !== 'undefined') cartPage.appliedCoupon = null;
                this.renderSuccess(order);
            }
        } catch (err) {
            appToast.error(err.message || 'Không thể tạo đơn hàng.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> Xác Nhận Đặt Hàng';
        }
    },

    /* ------------------------- Phiên thanh toán QR ------------------------- */

    stopTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    },

    async showSession(session) {
        this.session = session;
        try {
            this.sessionOrder = await ApiService.orders.get(session.orderId);
        } catch (err) {
            this.sessionOrder = null;
        }
        this.drawSession();
        this.startTimer();
    },

    drawSession() {
        const s = this.session;
        const o = this.sessionOrder;
        const container = document.getElementById('main-view');

        container.innerHTML = `
            <div class="container py-8">
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 2rem; max-width: 860px; margin: 0 auto; box-shadow: var(--shadow-xl);">
                    <div class="d-flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h1 class="text-xl font-bold"><i class="fa-solid fa-qrcode text-primary mr-2"></i> Thanh Toán Đơn ${esc(s.orderCode)}</h1>
                        <div class="badge badge-subtle">Còn lại <strong id="qr-countdown" class="text-primary">--:--</strong></div>
                    </div>

                    <div class="vietqr-box" id="qr-live-box">
                        <div class="vietqr-image-wrap">
                            <img src="${esc(s.qrImage)}" alt="VietQR" style="width: 240px; height: 240px;">
                            <div class="text-xs font-bold text-primary mt-2">
                                <i class="fa-solid fa-arrows-rotate fa-spin mr-1"></i> Đang chờ tiền về tài khoản...
                            </div>
                        </div>

                        <div class="vietqr-bank-details">
                            <div class="copy-detail-row"><span class="text-muted">Ngân hàng:</span><strong>${esc(s.bankName)}</strong></div>
                            <div class="copy-detail-row">
                                <span class="text-muted">Số tài khoản:</span>
                                <div class="d-flex items-center gap-2">
                                    <strong class="text-primary">${esc(s.accountNo)}</strong>
                                    <button class="btn btn-xs btn-ghost text-primary" onclick="checkoutPage.copy('${esc(s.accountNo)}', 'số tài khoản')"><i class="fa-regular fa-copy"></i></button>
                                </div>
                            </div>
                            <div class="copy-detail-row"><span class="text-muted">Chủ tài khoản:</span><strong>${esc(s.accountName)}</strong></div>
                            <div class="copy-detail-row">
                                <span class="text-muted">Số tiền:</span>
                                <div class="d-flex items-center gap-2">
                                    <strong class="text-danger">${store.formatCurrency(s.amount)}</strong>
                                    <button class="btn btn-xs btn-ghost text-primary" onclick="checkoutPage.copy('${s.amount}', 'số tiền')"><i class="fa-regular fa-copy"></i></button>
                                </div>
                            </div>
                            <div class="copy-detail-row">
                                <span class="text-muted">Nội dung (bắt buộc):</span>
                                <div class="d-flex items-center gap-2">
                                    <strong class="text-primary">${esc(s.paymentCode)}</strong>
                                    <button class="btn btn-xs btn-ghost text-primary" onclick="checkoutPage.copy('${esc(s.paymentCode)}', 'nội dung')"><i class="fa-regular fa-copy"></i></button>
                                </div>
                            </div>
                            <p class="text-xs text-muted mt-2">Chuyển đúng số tiền và đúng nội dung để hệ thống tự xác nhận.</p>
                        </div>
                    </div>

                    <div class="p-4 rounded-lg mt-4 text-sm" style="background: var(--bg-subtle);">
                        <div class="font-bold mb-2">Chi tiết đơn hàng</div>
                        ${(s.items || []).map(i => `<div class="text-xs text-muted py-1">• ${esc(i)}</div>`).join('')}
                        ${o ? `<div class="mt-2">${this.breakdownHtml(o.subtotal, o.discountAmount, o.shippingFee, o.totalAmount, o.couponCode)}</div>` : ''}
                    </div>

                    <div class="d-flex items-center justify-center gap-3 mt-4 flex-wrap">
                        <button class="btn btn-primary" id="btn-check-paid" onclick="checkoutPage.checkNow()"><i class="fa-solid fa-circle-check mr-1"></i> Tôi Đã Chuyển Khoản</button>
                        <button class="btn btn-outline-danger" onclick="modalManager.confirm({
                            title: 'Huỷ thanh toán',
                            message: 'Huỷ phiên thanh toán sẽ huỷ luôn đơn hàng này. Bạn có chắc không?',
                            onConfirm: () => checkoutPage.cancelSession()
                        })"><i class="fa-solid fa-xmark mr-1"></i> Huỷ Đơn</button>
                    </div>
                </div>
            </div>
        `;
        this.tick();
    },

    copy(text, label) {
        navigator.clipboard.writeText(text);
        appToast.success(`Đã sao chép ${label}!`);
    },

    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => this.tick(), 1000);
    },

    tick() {
        const el = document.getElementById('qr-countdown');
        if (!el || !this.session) { this.stopTimer(); return; } // đã rời trang
        const left = Math.max(0, Math.floor((new Date(this.session.expiresAt).getTime() - Date.now()) / 1000));
        el.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;

        // hỏi server mỗi 4 giây xem tiền đã về chưa, và khi hết giờ để lấy trạng thái cuối
        if (left % 4 === 0) this.refreshSession();
    },

    async refreshSession(useCheck) {
        if (this.polling || !this.session) return;
        this.polling = true;
        try {
            const s = useCheck ? await ApiService.qr.check(this.session.sessionId) : await ApiService.qr.get(this.session.sessionId);
            if (!document.getElementById('qr-countdown')) return;
            if (s.status !== 'PENDING') {
                this.session = s;
                this.stopTimer();
                await this.finishSession();
            }
        } catch (err) {
            // lỗi mạng thoáng qua: thử lại ở nhịp sau
        } finally {
            this.polling = false;
        }
    },

    async checkNow() {
        const btn = document.getElementById('btn-check-paid');
        if (btn) btn.disabled = true;
        await this.refreshSession(true);
        const again = document.getElementById('btn-check-paid');
        if (again) {
            again.disabled = false;
            appToast.info('Chưa thấy giao dịch, vui lòng đợi vài giây sau khi chuyển khoản.', 'Đang chờ');
        }
    },

    async finishSession() {
        const s = this.session;
        await store.refreshCart().catch(() => {});
        if (s.status === 'PAID') {
            this.renderSuccess(this.sessionOrder, s);
            return;
        }
        const expired = s.status === 'EXPIRED';
        document.getElementById('main-view').innerHTML = `
            <div class="container py-12">
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 3rem 2rem; max-width: 560px; margin: 0 auto; text-align: center;">
                    <i class="fa-solid ${expired ? 'fa-clock' : 'fa-circle-xmark'} text-danger mb-3" style="font-size: 3rem;"></i>
                    <h2 class="text-xl font-bold mb-2">${expired ? 'Phiên thanh toán đã hết hạn' : 'Đơn hàng đã được huỷ'}</h2>
                    <p class="text-muted text-sm mb-4">${esc(s.cancelReason || 'Bạn có thể chọn lại sách và đặt hàng mới.')}</p>
                    <a href="#/catalog" class="btn btn-primary">Tiếp Tục Mua Sắm</a>
                </div>
            </div>
        `;
    },

    async cancelSession() {
        try {
            this.stopTimer();
            await ApiService.qr.cancel(this.session.sessionId);
            await store.refreshCart();
            appToast.info('Đã huỷ phiên thanh toán và đơn hàng.');
            app.navigate('#/catalog');
        } catch (err) {
            app.showError(err);
            this.startTimer();
        }
    },

    renderSuccess(order, session) {
        const paid = !!session && session.status === 'PAID';
        document.getElementById('main-view').innerHTML = `
            <div class="container py-12">
                <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 3.5rem 2rem; max-width: 680px; margin: 0 auto; text-align: center; box-shadow: var(--shadow-xl);">
                    <div style="width: 72px; height: 72px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 2.25rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h1 class="text-2xl font-bold mb-2">${paid ? 'Thanh Toán Thành Công!' : 'Đặt Hàng Thành Công!'}</h1>
                    <p class="text-muted text-sm mb-6">Mã đơn hàng: <strong class="text-primary font-bold">${esc(order ? order.orderCode : session.orderCode)}</strong>. Cảm ơn bạn đã tin tưởng BookNest!</p>

                    ${order ? `
                    <div class="p-4 rounded-lg mb-6 text-left text-sm" style="background: var(--bg-subtle);">
                        <div class="d-flex justify-between py-1"><span>Người nhận:</span> <strong>${esc(order.customerName)} (${esc(order.customerPhone)})</strong></div>
                        <div class="d-flex justify-between py-1 gap-3"><span>Địa chỉ:</span> <strong style="text-align: right;">${esc(order.shippingAddress)}</strong></div>
                        <div class="d-flex justify-between py-1"><span>Thanh toán:</span> <strong>${paid ? `Đã nhận ${store.formatCurrency(session.receivedAmount || session.amount)} qua VietQR` : 'Thanh toán khi nhận hàng (COD)'}</strong></div>
                        <div class="d-flex justify-between py-1"><span>Phí vận chuyển:</span> <strong>${order.shippingFee === 0 ? 'Miễn phí' : store.formatCurrency(order.shippingFee)}</strong></div>
                        <div class="d-flex justify-between py-1"><span>Tổng thanh toán:</span> <strong class="text-primary font-bold text-base">${store.formatCurrency(order.totalAmount)}</strong></div>
                    </div>` : ''}

                    <div class="d-flex items-center justify-center gap-3">
                        <a href="#/profile?tab=orders" class="btn btn-primary"><i class="fa-solid fa-box-open mr-1"></i> Xem Đơn Hàng Của Tôi</a>
                        <a href="#/" class="btn btn-ghost">Về Trang Chủ</a>
                    </div>
                </div>
            </div>
        `;
    }
};
